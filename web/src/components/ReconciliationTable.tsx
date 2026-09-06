import React, { useState } from 'react';
import {
  Check,
  RotateCcw,
  Upload,
  Plus,
  Search,
  FileSpreadsheet,
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
        is_reconciled: true,
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
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight uppercase">
            Mesa de Conciliación
          </h1>
          <p className="text-xs text-zinc-500 mt-1 font-mono uppercase tracking-wider">
            Validación de movimientos y extractos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setUploadResult(null);
              setUploadError(null);
              setIsUploadOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono uppercase tracking-wider border border-zinc-800 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-400" />
            <span>CARGAR EXTRACTO</span>
          </button>

          <button
            onClick={() => setIsNewTxOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-mono uppercase tracking-wider transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>NUEVO TX</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Toolbar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-md p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-sm border border-zinc-800 text-xs self-start md:self-auto font-mono uppercase tracking-wider">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-sm transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              PENDIENTES [{pendingCount}]
            </button>
            <button
              onClick={() => setStatusFilter('reconciled')}
              className={`px-3 py-1.5 rounded-sm transition-colors ${
                statusFilter === 'reconciled'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              CONCILIADOS [{reconciledCount}]
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-sm transition-colors ${
                statusFilter === 'all'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              TODOS [{transactions.length}]
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar tx..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-sm pl-8 pr-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 w-44 sm:w-60 font-mono"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-sm px-2.5 py-1.5 text-xs text-zinc-400 focus:outline-none focus:border-zinc-700 font-mono uppercase"
            >
              <option value="all">TODAS CATS</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-sm border border-zinc-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-950 text-zinc-500 border-b border-zinc-800 font-mono uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-normal">Fecha</th>
                <th className="py-3 px-4 font-normal">Origen & Desc</th>
                <th className="py-3 px-4 font-normal">Categoría</th>
                <th className="py-3 px-4 text-right font-normal">Monto</th>
                <th className="py-3 px-4 text-center font-normal">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 bg-zinc-900">
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
                      className={`hover:bg-zinc-800/50 transition-colors ${
                        tx.is_reconciled ? 'opacity-60' : ''
                      }`}
                    >
                      {/* Fecha */}
                      <td className="py-3 px-4 font-mono text-zinc-400 whitespace-nowrap text-[11px]">
                        {txDate.toUpperCase()}
                      </td>

                      {/* Descripción & Origen */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-zinc-200">{tx.description}</div>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-500 font-mono uppercase">
                          <span className="px-1 py-0.5 rounded-sm bg-zinc-950 border border-zinc-800">
                            {tx.payment_method}
                          </span>
                          {tx.counterparty && (
                            <span>{tx.counterparty}</span>
                          )}
                        </div>
                      </td>

                      {/* Selector de Categoría Interactivo */}
                      <td className="py-3 px-4">
                        <select
                          value={tx.category}
                          onChange={(e) => handleCategoryChange(tx, e.target.value)}
                          className="bg-zinc-950 text-zinc-300 border border-zinc-800 rounded-sm px-2 py-1 text-[11px] font-mono uppercase focus:outline-none focus:border-zinc-700 cursor-pointer"
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
                        className={`py-3 px-4 text-right font-mono text-sm whitespace-nowrap ${
                          isExpense ? 'text-zinc-400' : 'text-zinc-100'
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
                          <div className="flex items-center justify-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] font-mono uppercase bg-zinc-950 border border-zinc-800 text-zinc-400">
                              <Check className="w-3 h-3" />
                              OK
                            </span>
                            <button
                              onClick={() => handleToggleReconcile(tx)}
                              className="p-1 rounded-sm text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                              title="Revertir"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleToggleReconcile(tx)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-[10px] font-mono uppercase bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors cursor-pointer"
                          >
                            <Check className="w-3 h-3 text-zinc-400" />
                            <span>VERIFICAR</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-zinc-500 font-mono uppercase text-xs tracking-widest">
                    SIN REGISTROS ACTIVOS
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Subir extracto Mercado Pago */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-md max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 font-mono uppercase tracking-wider">
                <FileSpreadsheet className="w-4 h-4 text-zinc-400" />
                Ingesta de Datos
              </h2>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-zinc-500 hover:text-zinc-200 p-1 rounded-sm hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-500 font-mono">
              Sube archivo .csv / .xlsx de Mercado Pago para procesar.
            </p>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="border border-dashed border-zinc-700 hover:border-zinc-500 bg-zinc-950 p-6 text-center transition-colors">
                <input
                  type="file"
                  id="mp-file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label
                  htmlFor="mp-file"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <Upload className="w-6 h-6 text-zinc-500" />
                  <span className="text-xs font-mono text-zinc-300 uppercase tracking-wider">
                    {uploadFile ? uploadFile.name : 'SELECCIONAR ARCHIVO LOCAL'}
                  </span>
                </label>
              </div>

              {uploadError && (
                <div className="p-3 bg-red-950/30 border border-red-900/50 text-red-400 text-xs font-mono uppercase">
                  ERROR: {uploadError}
                </div>
              )}

              {uploadResult && (
                <div className="p-3 bg-green-950/30 border border-green-900/50 text-green-400 text-xs font-mono space-y-1 uppercase tracking-wider">
                  <div className="flex items-center gap-2 font-bold mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>INGESTA EXITOSA</span>
                  </div>
                  <div>FILAS LEÍDAS: {uploadResult.processed_rows}</div>
                  <div>NUEVOS TX: {uploadResult.imported_count}</div>
                  <div className="text-zinc-500">IGNORADOS: {uploadResult.skipped_duplicates}</div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 bg-zinc-950 text-zinc-400 text-xs font-mono uppercase hover:text-zinc-200 border border-zinc-800"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || uploadLoading}
                  className="px-4 py-2 bg-zinc-100 text-zinc-950 text-xs font-mono font-bold uppercase hover:bg-white disabled:opacity-50 flex items-center gap-2"
                >
                  {uploadLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>EJECUTANDO</span>
                    </>
                  ) : (
                    <span>EJECUTAR INGESTA</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear movimiento manual */}
      {isNewTxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-md max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2 font-mono uppercase tracking-wider">
                <Plus className="w-4 h-4 text-zinc-400" />
                NUEVO TX MANUAL
              </h2>
              <button
                onClick={() => setIsNewTxOpen(false)}
                className="text-zinc-500 hover:text-zinc-200 p-1 rounded-sm hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTx} className="space-y-4">
              <div className="flex gap-2 font-mono text-xs uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setNewType('expense')}
                  className={`flex-1 py-2 border transition-colors ${
                    newType === 'expense'
                      ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                      : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:bg-zinc-900'
                  }`}
                >
                  GASTO [-]
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('income')}
                  className={`flex-1 py-2 border transition-colors ${
                    newType === 'income'
                      ? 'bg-zinc-800 text-zinc-100 border-zinc-600'
                      : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:bg-zinc-900'
                  }`}
                >
                  INGRESO [+]
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">MONTO [ARS]</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">DESCRIPCIÓN</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Terminal Service"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1">CATEGORÍA</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs font-mono uppercase text-zinc-300 focus:outline-none focus:border-zinc-700"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsNewTxOpen(false)}
                  className="px-4 py-2 bg-zinc-950 text-zinc-400 text-xs font-mono uppercase hover:text-zinc-200 border border-zinc-800"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTx}
                  className="px-4 py-2 bg-zinc-100 text-zinc-950 text-xs font-mono font-bold uppercase hover:bg-white flex items-center gap-2 disabled:opacity-50"
                >
                  {isCreatingTx ? 'GUARDANDO...' : 'REGISTRAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
