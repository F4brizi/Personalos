import io
from datetime import datetime
from typing import List, Dict, Any, Tuple
import pandas as pd


def parse_mercadopago_file(file_bytes: bytes, filename: str) -> Tuple[List[Dict[str, Any]], List[str]]:
    """
    Parsea un extracto descargado de Mercado Pago (CSV o Excel)
    y lo convierte en transacciones estandarizadas.
    """
    errors = []
    transactions = []

    try:
        if filename.endswith(".csv"):
            # Intento de lectura con coma o punto y coma
            try:
                df = pd.read_csv(io.BytesIO(file_bytes), sep=";", encoding="utf-8")
                if len(df.columns) <= 1:
                    df = pd.read_csv(io.BytesIO(file_bytes), sep=",", encoding="utf-8")
            except UnicodeDecodeError:
                df = pd.read_csv(io.BytesIO(file_bytes), sep=";", encoding="latin-1")
                if len(df.columns) <= 1:
                    df = pd.read_csv(io.BytesIO(file_bytes), sep=",", encoding="latin-1")
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(file_bytes))
        else:
            return [], [f"Formato de archivo no soportado: {filename}. Usa CSV o Excel."]
    except Exception as e:
        return [], [f"Error al leer el archivo: {str(e)}"]

    # Normalizar nombres de columnas a minúsculas y sin espacios
    df.columns = [str(c).strip().lower() for c in df.columns]

    for idx, row in df.iterrows():
        try:
            # Buscar columna de ID externo
            external_id = None
            for col in ["operation_id", "id_operacion", "id de la operación", "referencia", "id"]:
                if col in df.columns and pd.notna(row[col]):
                    external_id = str(row[col]).strip()
                    break

            # Buscar columna de fecha
            tx_date = datetime.now()
            for col in ["date", "fecha", "release_date", "fecha_creacion"]:
                if col in df.columns and pd.notna(row[col]):
                    try:
                        tx_date = pd.to_datetime(row[col]).to_pydatetime()
                        break
                    except Exception:
                        pass

            # Buscar descripción y contraparte
            description = "Movimiento Mercado Pago"
            for col in ["description", "descripcion", "detalle", "concepto", "motivo"]:
                if col in df.columns and pd.notna(row[col]):
                    description = str(row[col]).strip()
                    break

            counterparty = None
            for col in ["counterparty", "contraparte", "nombre", "comercio", "titular"]:
                if col in df.columns and pd.notna(row[col]):
                    counterparty = str(row[col]).strip()
                    break

            # Buscar monto
            amount = 0.0
            for col in ["net_credit", "monto", "monto neto", "total", "importe", "settlement_amount"]:
                if col in df.columns and pd.notna(row[col]):
                    val_str = str(row[col]).replace("$", "").replace(" ", "").replace(".", "").replace(",", ".")
                    try:
                        amount = float(val_str)
                        break
                    except ValueError:
                        pass

            tx_type = "income" if amount > 0 else "expense"

            # Auto-categorización preliminar por texto
            desc_lower = description.lower()
            category = "Sin categorizar"
            if any(k in desc_lower for k in ["super", "coto", "dia", "carrefour", "jumbo", "verduleria"]):
                category = "Alimentación"
            elif any(k in desc_lower for k in ["uber", "cabify", "didi", "sube", "nafta", "ypf", "shell"]):
                category = "Transporte"
            elif any(k in desc_lower for k in ["farmacia", "farmacity", "medico", "salud"]):
                category = "Salud"
            elif any(k in desc_lower for k in ["netflix", "spotify", "steam", "cine"]):
                category = "Ocio y Suscripciones"
            elif any(k in desc_lower for k in ["edenor", "metrogas", "telecentro", "fibertel", "luz", "gas"]):
                category = "Servicios"
            elif amount > 0:
                category = "Ingresos"

            raw_row_data = {k: (None if pd.isna(v) else str(v)) for k, v in row.to_dict().items()}

            transactions.append({
                "external_id": external_id,
                "date": tx_date,
                "amount": amount,
                "currency": "ARS",
                "description": description,
                "counterparty": counterparty,
                "category": category,
                "payment_method": "Mercado Pago",
                "type": tx_type,
                "is_reconciled": False,
                "raw_data": raw_row_data
            })
        except Exception as e:
            errors.append(f"Fila {idx}: error al procesar - {str(e)}")

    return transactions, errors
