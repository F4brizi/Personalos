import React, { useState } from 'react';
import {
  Check,
  RotateCcw,
  Upload,
  Plus,
  Search,
  FileSpreadsheet,
  AlertCircle,
  X,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Transaction } from '../lib/api';

interface ReconciliationTableProps {
  transactions: Transaction[];
  onRefresh: () => void;
}

const CATEGORIES = [
  'Sin categorizar',
  'Alimentación',
  'Transporte',
  'Salud',
  'Servicios',
  'Ocio y Suscripciones',
  'Educación',
  'Hogar',
  'Ingresos',
  'Inversiones',
];

export const ReconciliationTable: React.FC<ReconciliationTableProps> = ({
  transactions,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reconciled'>('pending');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modales
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isNewTxOpen, setIsNewTxOpen] = useState(false);

  // Estados de carga
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Nuevo gasto form
  const [newAmount, setNewAmount] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Alimentación');
  const [newType, setNewType] = useState<'expense' | 'income'>('expense');
  const [isCreatingTx, setIsCreatingTx] = useState(false);

  // Acción rápida: Toggle Conciliación
  const handleToggleReconcile = async (tx: Transaction) => {
    try {
      await api.updateTransaction(tx.id, {
        is_reconciled: !tx.is_reconciled,
      });
      onRefresh();
    } catch (err) {
      console.error('Error toggling reconcile:', err);
    }
  };

  // Acción rápida: Cambio de Categoría
  const handleCategoryChange = async (tx: Transaction, newCat: string) => {
    try {
      await api.updateTransaction(tx.id, {
        category: newCat,
      });
      onRefresh();
    } catch (err) {
      console.error('Error updating category:', err);
    }
  };

  // Subir archivo Mercado Pago
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploadLoading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const res = await api.uploadMercadoPago(uploadFile);
      setUploadResult(res);
      setUploadFile(null);
      onRefresh();
    } catch (err: any) {
      setUploadError(err.message || 'Error al subir extracto');
    } finally {
      setUploadLoading(false);
    }
  };

  // Crear transacción manual
  const handleCreateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmount || !newDesc) return;

    setIsCreatingTx(true);
    try {
      const parsedAmount = parseFloat(newAmount);
      const finalAmount = newType === 'expense' ? -Math.abs(parsedAmount) : Math.abs(parsedAmount);

      await api.createTransaction({
        date: new Date().toISOString(),
        amount: finalAmount,
        currency: 'ARS',
        description: newDesc,
        category: newCategory,
        payment_method: 'Mercado Pago',
        type: newType,
        is_reconciled: true, // los manuales entran conciliados por defecto
      });

      setNewAmount('');
      setNewDesc('');
      setIsNewTxOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingTx(false);
    }
  };

  // Filtros en memoria
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.counterparty && tx.counterparty.toLowerCase().includes(searchTerm.toLowerCase())) ||
      tx.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'pending'
        ? !tx.is_reconciled
        : tx.is_reconciled;

    const matchesCategory =
      categoryFilter === 'all' ? true : tx.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const pendingCount = transactions.filter((t) => !t.is_reconciled).length;
  const reconciledCount = transactions.filter((t) => t.is_reconciled).length;

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Mesa de Conciliación Bancaria
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Concilia, categoriza y valida tus movimientos de Mercado Pago y gastos manuales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setUploadResult(null);
              setUploadError(null);
              setIsUploadOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all cursor-pointer shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Cargar Extracto MP</span>
          </button>

          <button
            onClick={() => setIsNewTxOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Movimiento</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs self-start md:self-auto">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === 'pending'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pendientes ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('reconciled')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === 'reconciled'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Conciliados ({reconciledCount})
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({transactions.length})
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por detalle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950/60 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44 sm:w-60"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950/60 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Todas las categorías</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Descripción & Origen</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4 text-right">Monto</th>
                <th className="py-3 px-4 text-center">Estado / Conciliar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => {
                  const txDate = new Date(tx.date).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                  const isExpense = tx.amount < 0;

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        tx.is_reconciled ? 'opacity-80' : ''
                      }`}
                    >
                      {/* Fecha */}
                      <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                        {txDate}
                      </td>

                      {/* Descripción & Origen */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-200">{tx.description}</div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                            {tx.payment_method}
                          </span>
                          {tx.counterparty && (
                            <span className="text-slate-400">· {tx.counterparty}</span>
                          )}
                        </div>
                      </td>

                      {/* Selector de Categoría Interactivo */}
                      <td className="py-3 px-4">
                        <select
                          value={tx.category}
                          onChange={(e) => handleCategoryChange(tx, e.target.value)}
                          className="bg-slate-950/70 text-slate-200 border border-slate-700/80 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Monto */}
                      <td
                        className={`py-3 px-4 text-right font-mono font-semibold whitespace-nowrap ${
                          isExpense ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {isExpense ? '-' : '+'}
                        ${Math.abs(tx.amount).toLocaleString('es-AR', {
                          minimumFractionDigits: 2,
                        })}
                      </td>

                      {/* Botón de Conciliación */}
                      <td className="py-3 px-4 text-center">
                        {tx.is_reconciled ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <Check className="w-3 h-3" />
                              Conciliado
                            </span>
                            <button
                              onClick={() => handleToggleReconcile(tx)}
                              className="p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
                              title="Desmarcar conciliación"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleToggleReconcile(tx)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all shadow-sm cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 text-amber-400" />
                            <span>Conciliar</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500">
                    No se encontraron transacciones con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Subir extracto Mercado Pago */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                Cargar Extracto de Mercado Pago
              </h2>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Sube tu archivo descargado de Mercado Pago (formato <code>.csv</code> o <code>.xlsx</code>). El sistema identificará importes, contrapartes y omitirá duplicados automáticamente.
            </p>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-xl p-6 text-center transition-all bg-slate-950/40">
                <input
                  type="file"
                  id="mp-file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label
                  htmlFor="mp-file"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-indigo-400" />
                  <span className="text-xs font-medium text-slate-300">
                    {uploadFile ? uploadFile.name : 'Haz clic para seleccionar tu archivo CSV o Excel'}
                  </span>
                  <span className="text-[10px] text-slate-500">Extractos mensuales o de período</span>
                </label>
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadResult && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>¡Importación completada!</span>
                  </div>
                  <div className="text-[11px] text-emerald-300">
                    • Filas procesadas: {uploadResult.processed_rows} <br />
                    • Nuevas transacciones: {uploadResult.imported_count} <br />
                    • Duplicados omitidos: {uploadResult.skipped_duplicates}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || uploadLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {uploadLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <span>Importar y Procesar</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear movimiento manual */}
      {isNewTxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Nuevo Movimiento Manual
              </h2>
              <button
                onClick={() => setIsNewTxOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTx} className="space-y-3.5">
              <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewType('expense')}
                  className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-all ${
                    newType === 'expense'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'text-slate-400'
                  }`}
                >
                  Gasto (-)
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('income')}
                  className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-all ${
                    newType === 'income'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400'
                  }`}
                >
                  Ingreso (+)
                </button>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Monto ($ ARS)</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="ej. 4500"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Descripción / Detalle</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Supermercado Coto, Almuerzo"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Categoría</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewTxOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTx}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 flex items-center gap-1.5"
                >
                  {isCreatingTx ? 'Guardando...' : 'Guardar Movimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
