import { useState, useRef } from 'react';
import { apiClient } from '../../api/client';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';

interface ImportResult {
  sheetsProcessed: number;
  rowsImported: number;
  errors: Array<{ sheet: string; row: number; message: string }>;
  warnings: string[];
}

export function ImportPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/migration/import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Import failed');
      }
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Importar Excel</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
             onClick={() => inputRef.current?.click()}>
          <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">Seleccioná el archivo Excel</p>
          <p className="text-sm text-gray-400">LISTA DE PRECIO JULIO 2026.xlsx</p>
          <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden"
                 onChange={e => setFile(e.target.files?.[0] || null)} />
        </div>

        {file && (
          <div className="mt-4 flex items-center justify-between bg-gray-50 p-3 rounded">
            <span className="text-sm font-medium">{file.name}</span>
            <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
          </div>
        )}

        <button onClick={handleImport} disabled={!file || loading}
                className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
          <Upload className="w-5 h-5" />
          {loading ? 'Importando...' : 'Importar Excel'}
        </button>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Importación completada</p>
                <p className="text-sm text-green-600">
                  {result.rowsImported} productos importados de {result.sheetsProcessed} hojas
                </p>
              </div>
            </div>
            {result.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="font-medium text-yellow-800 mb-2">{result.warnings.length} advertencias</p>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {result.warnings.slice(0, 10).map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-medium text-red-800 mb-2">{result.errors.length} errores</p>
                <ul className="text-sm text-red-700 space-y-1">
                  {result.errors.slice(0, 10).map((e, i) => <li key={i}>{e.sheet}: {e.message}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
