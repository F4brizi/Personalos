import uuid
from datetime import datetime
from typing import Optional, Any, Dict, List
from pydantic import BaseModel, ConfigDict, Field


class TransactionBase(BaseModel):
    date: datetime
    amount: float = Field(..., description="Monto en moneda especificada")
    currency: str = "ARS"
    description: str
    counterparty: Optional[str] = None
    category: str = "Sin categorizar"
    payment_method: str = "Mercado Pago"
    type: str = "expense"
    is_reconciled: bool = False
    notes: Optional[str] = None


class TransactionCreate(TransactionBase):
    external_id: Optional[str] = None
    raw_data: Optional[Dict[str, Any]] = None


class TransactionUpdate(BaseModel):
    category: Optional[str] = None
    is_reconciled: Optional[bool] = None
    notes: Optional[str] = None
    description: Optional[str] = None


class TransactionResponse(TransactionBase):
    id: uuid.UUID
    external_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TransactionSummary(BaseModel):
    total_income: float
    total_expense: float
    net_balance: float
    pending_reconciliation_count: int
    by_category: Dict[str, float]
