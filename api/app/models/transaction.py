import uuid
from datetime import datetime
from typing import Optional, Any, Dict
from sqlalchemy import String, Float, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.models.base import TimestampMixin


class Transaction(Base, TimestampMixin):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    external_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=True,
        comment="ID de operación de Mercado Pago u origen externo"
    )
    date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
        nullable=False
    )
    amount: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="Monto (positivo ingreso, negativo egreso)"
    )
    currency: Mapped[str] = mapped_column(
        String(10),
        default="ARS",
        nullable=False
    )
    description: Mapped[str] = mapped_column(
        String(255),
        index=True,
        nullable=False
    )
    counterparty: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        comment="Nombre del comercio o persona involucrada"
    )
    category: Mapped[str] = mapped_column(
        String(100),
        default="Sin categorizar",
        index=True,
        nullable=False
    )
    payment_method: Mapped[str] = mapped_column(
        String(100),
        default="Mercado Pago",
        nullable=False
    )
    type: Mapped[str] = mapped_column(
        String(50),
        default="expense",
        nullable=False,
        comment="expense, income, transfer, investment"
    )
    is_reconciled: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        index=True,
        nullable=False,
        comment="Estado de conciliación manual/automática"
    )
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    raw_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
        comment="Payload original importado desde el extracto"
    )
