import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.transaction import Transaction
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TransactionSummary,
)
from app.services.mercadopago_parser import parse_mercadopago_file

router = APIRouter()


@router.get("", response_model=List[TransactionResponse])
async def list_transactions(
    db: AsyncSession = Depends(get_db),
    is_reconciled: Optional[bool] = Query(None, description="Filtrar por estado de conciliación"),
    category: Optional[str] = Query(None, description="Filtrar por categoría"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    query = select(Transaction).order_by(Transaction.date.desc())
    filters = []
    if is_reconciled is not None:
        filters.append(Transaction.is_reconciled == is_reconciled)
    if category is not None:
        filters.append(Transaction.category == category)

    if filters:
        query = query.where(and_(*filters))

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    tx_in: TransactionCreate,
    db: AsyncSession = Depends(get_db)
):
    if tx_in.external_id:
        existing = await db.execute(
            select(Transaction).where(Transaction.external_id == tx_in.external_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Ya existe una transacción con external_id '{tx_in.external_id}'"
            )

    tx = Transaction(**tx_in.model_dump())
    db.add(tx)
    await db.commit()
    await db.refresh(tx)
    return tx


@router.get("/summary", response_model=TransactionSummary)
async def get_transactions_summary(
    db: AsyncSession = Depends(get_db)
):
    # Total ingresos
    income_res = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0.0))
        .where(Transaction.amount > 0)
    )
    total_income = float(income_res.scalar_one())

    # Total egresos
    expense_res = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0.0))
        .where(Transaction.amount < 0)
    )
    total_expense = abs(float(expense_res.scalar_one()))

    # Cantidad pendiente de conciliación
    pending_res = await db.execute(
        select(func.count(Transaction.id))
        .where(Transaction.is_reconciled.is_(False))
    )
    pending_count = int(pending_res.scalar_one())

    # Por categoría (solo egresos)
    cat_res = await db.execute(
        select(Transaction.category, func.coalesce(func.sum(Transaction.amount), 0.0))
        .where(Transaction.amount < 0)
        .group_by(Transaction.category)
    )
    by_category = {row[0]: abs(float(row[1])) for row in cat_res.all()}

    return TransactionSummary(
        total_income=total_income,
        total_expense=total_expense,
        net_balance=total_income - total_expense,
        pending_reconciliation_count=pending_count,
        by_category=by_category
    )


@router.patch("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: uuid.UUID,
    tx_update: TransactionUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    )
    tx = result.scalar_one_or_none()
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transacción no encontrada"
        )

    update_data = tx_update.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(tx, field, val)

    await db.commit()
    await db.refresh(tx)
    return tx


@router.post("/upload-mercadopago")
async def upload_mercadopago_statement(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    content = await file.read()
    parsed_items, errors = parse_mercadopago_file(content, file.filename or "statement.csv")

    if not parsed_items and errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "No se pudieron procesar las transacciones", "errors": errors}
        )

    created_count = 0
    skipped_count = 0

    for item in parsed_items:
        # Verificar duplicados si tiene external_id
        if item.get("external_id"):
            exists = await db.execute(
                select(Transaction.id).where(Transaction.external_id == item["external_id"])
            )
            if exists.scalar_one_or_none():
                skipped_count += 1
                continue

        tx = Transaction(**item)
        db.add(tx)
        created_count += 1

    await db.commit()

    return {
        "filename": file.filename,
        "processed_rows": len(parsed_items),
        "imported_count": created_count,
        "skipped_duplicates": skipped_count,
        "parser_warnings": errors[:10]  # Limitar errores de muestra
    }
