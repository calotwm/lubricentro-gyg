import { Link } from 'react-router-dom';
import { useLowStockReport } from '../../hooks/useReports';
import { useStockMovements } from '../../hooks/useStock';
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, RefreshCw, Package, Warehouse } from 'lucide-react';

export function DashboardPage() {
  const { data: lowStockData, isLoading: isLoadingLowStock } = useLowStockReport();
  const { data: movementsData, isLoading: isLoadingMovements } = useStockMovements({ limit: 10 });

  const lowStockItems = lowStockData?.data || [];
  const recentMovements = movementsData?.data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/products"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Products</p>
              <p className="text-lg font-semibold text-gray-900">View Catalog</p>
            </div>
          </div>
        </Link>

        <Link
          to="/stock"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Warehouse className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Stock</p>
              <p className="text-lg font-semibold text-gray-900">Manage Stock</p>
            </div>
          </div>
        </Link>

        <Link
          to="/reports"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Reports</p>
              <p className="text-lg font-semibold text-gray-900">View Reports</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h2>
            {lowStockItems.length > 0 && (
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                {lowStockItems.length} items
              </span>
            )}
          </div>

          {isLoadingLowStock && (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          )}

          {!isLoadingLowStock && lowStockItems.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              All products have sufficient stock
            </div>
          )}

          {!isLoadingLowStock && lowStockItems.length > 0 && (
            <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
              {lowStockItems.map((item) => (
                <div key={item.productId} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                    <p className="text-xs text-gray-500">{item.brandName}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-red-600">{item.currentStock}</span>
                    <span className="text-xs text-gray-400">/ {item.minStockThreshold}</span>
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Movements */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Movements</h2>
          </div>

          {isLoadingMovements && (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          )}

          {!isLoadingMovements && recentMovements.length === 0 && (
            <div className="p-8 text-center text-gray-500">No recent movements</div>
          )}

          {!isLoadingMovements && recentMovements.length > 0 && (
            <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
              {recentMovements.map((m) => (
                <div key={m.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <MovementIcon type={m.movementType} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{m.productName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(m.createdAt).toLocaleDateString()} by {m.username}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${
                    m.movementType === 'entry' ? 'text-green-600' :
                    m.movementType === 'exit' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {m.movementType === 'entry' ? '+' : m.movementType === 'exit' ? '-' : '~'}
                    {Math.abs(m.quantity)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MovementIcon({ type }: { type: string }) {
  switch (type) {
    case 'entry':
      return <ArrowDownCircle className="w-5 h-5 text-green-500" />;
    case 'exit':
      return <ArrowUpCircle className="w-5 h-5 text-red-500" />;
    case 'adjustment':
      return <RefreshCw className="w-5 h-5 text-yellow-500" />;
    default:
      return <Package className="w-5 h-5 text-gray-400" />;
  }
}
