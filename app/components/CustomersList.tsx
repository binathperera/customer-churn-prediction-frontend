import { useEffect, useState } from "react";
import {
  fetchAllCustomers,
  predictCustomer,
  type Customer,
  type Prediction,
  checkAPIHealth,
} from "~/lib/api";

interface CustomerWithPrediction extends Customer {
  prediction?: Prediction;
  loading?: boolean;
  error?: string;
}

const ITEMS_PER_PAGE = 10;

export function CustomersList() {
  const [customers, setCustomers] = useState<CustomerWithPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [apiHealthy, setApiHealthy] = useState(false);
  const [predictingIds, setPredictingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkHealth = async () => {
      const healthy = await checkAPIHealth();
      setApiHealthy(healthy);
      if (!healthy) {
        setError(
          "Cannot connect to API. Make sure the backend is running on http://localhost:5000",
        );
        setLoading(false);
        return;
      }

      await loadCustomers();
    };

    checkHealth();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllCustomers();
      setCustomers(data);

      // Auto-predict first batch
      //   for (const customer of data.slice(0, ITEMS_PER_PAGE)) {
      //     await predictChurn(customer);
      //   }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const predictChurn = async (customer: Customer) => {
    try {
      setPredictingIds((prev) => new Set(prev).add(customer.CustomerId));
      const prediction = await predictCustomer(customer);

      setCustomers((prev) =>
        prev.map((c) =>
          c.CustomerId === customer.CustomerId
            ? { ...c, prediction, error: undefined }
            : c,
        ),
      );
    } catch (err) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.CustomerId === customer.CustomerId
            ? {
                ...c,
                error: err instanceof Error ? err.message : "Prediction failed",
              }
            : c,
        ),
      );
    } finally {
      setPredictingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(customer.CustomerId);
        return newSet;
      });
    }
  };

  const totalPages = Math.ceil(customers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCustomers = customers.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  if (!apiHealthy) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg bg-white p-8 text-center shadow-lg">
            <div className="mb-4 text-5xl">⚠️</div>
            <h1 className="mb-2 text-3xl font-bold text-red-600">
              Connection Error
            </h1>
            <p className="mb-4 text-lg text-gray-600">{error}</p>
            <p className="text-gray-500">
              Please ensure the backend API is running at{" "}
              <code className="rounded bg-gray-100 px-2 py-1">
                http://127.0.0.1:5000
              </code>
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 transition"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="border-b border-indigo-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                Customer Dashboard
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Analyze customer churn predictions
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-indigo-600">
                {customers.length}
              </p>
              <p className="text-gray-600">Total Customers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {loading && customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
            <p className="text-xl text-gray-600">Loading customers...</p>
          </div>
        ) : error && customers.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow-lg">
            <p className="text-lg text-red-600">{error}</p>
            <button
              onClick={loadCustomers}
              className="mt-4 rounded-lg bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700 transition"
            >
              Try Again
            </button>
          </div>
        ) : customers.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow-lg">
            <p className="text-xl text-gray-600">No customers found</p>
            <p className="mt-2 text-gray-500">
              Create some customer records to get started
            </p>
          </div>
        ) : (
          <>
            {/* Customers Table */}
            <div className="overflow-hidden rounded-lg shadow-lg">
              <div className="overflow-x-auto bg-white">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        ID
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Customer Info
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Account
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Churn Probability
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Decision Confidence
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedCustomers.map((customer, idx) => (
                      <tr
                        key={customer.CustomerId}
                        className="hover:bg-indigo-50 transition"
                      >
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
                            {customer.CustomerId}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-900">
                              {customer.Geography} • {customer.Gender}
                            </p>
                            <p className="text-sm text-gray-600">
                              Age: {customer.Age} years
                            </p>
                            <p className="text-sm text-gray-500">
                              Score: {customer.CreditScore}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">Balance:</span> $
                              {(customer.Balance / 1000).toFixed(1)}K
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Tenure:</span>{" "}
                              {customer.Tenure} years
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Active:</span>{" "}
                              {customer.IsActiveMember ? "✓" : "✗"}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {customer.loading ||
                          predictingIds.has(customer.CustomerId) ? (
                            <div className="flex items-center space-x-2">
                              <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-500"></div>
                              <span className="text-sm text-gray-600">
                                Predicting...
                              </span>
                            </div>
                          ) : customer.error ? (
                            <span className="text-sm text-red-600">Error</span>
                          ) : customer.prediction ? (
                            <div
                              className={`flex items-center space-x-2 rounded-lg px-3 py-2 ${
                                customer.prediction.churn === 1
                                  ? "bg-red-100"
                                  : "bg-green-100"
                              }`}
                            >
                              <span
                                className={`text-lg ${
                                  customer.prediction.churn === 1
                                    ? "text-red-600"
                                    : "text-green-600"
                                }`}
                              >
                                {customer.prediction.churn === 1 ? "⚠️" : "✓"}
                              </span>
                              <div>
                                <p
                                  className={`text-sm font-semibold ${
                                    customer.prediction.churn === 1
                                      ? "text-red-700"
                                      : "text-green-700"
                                  }`}
                                >
                                  {customer.prediction.status}
                                </p>
                                <p
                                  className={`text-xs ${
                                    customer.prediction.churn === 1
                                      ? "text-red-600"
                                      : "text-green-600"
                                  }`}
                                >
                                  {(
                                    customer.prediction.churn_probability * 100
                                  ).toFixed(1)}
                                  %
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {customer.prediction ? (
                            <div className="flex items-center">
                              <div className="relative w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    customer.prediction.confidence > 70
                                      ? "bg-green-500"
                                      : customer.prediction.confidence > 50
                                        ? "bg-yellow-500"
                                        : "bg-orange-500"
                                  }`}
                                  style={{
                                    width: `${customer.prediction.confidence}%`,
                                  }}
                                ></div>
                              </div>
                              <span className="ml-2 text-sm font-medium text-gray-900">
                                {customer.prediction.confidence.toFixed(1)}%
                              </span>
                            </div>
                          ) : null}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => predictChurn(customer)}
                            disabled={predictingIds.has(customer.CustomerId)}
                            className="inline-flex items-center space-x-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition disabled:bg-gray-400"
                          >
                            <span>Predict</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="mt-8 flex items-center justify-between rounded-lg bg-white p-6 shadow-lg">
              <div className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-semibold">
                  {startIndex + 1}-
                  {Math.min(startIndex + ITEMS_PER_PAGE, customers.length)}
                </span>{" "}
                of <span className="font-semibold">{customers.length}</span>{" "}
                customers
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition"
                >
                  Previous
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                          currentPage === pageNum
                            ? "bg-indigo-600 text-white"
                            : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition"
                >
                  Next
                </button>
              </div>

              <div className="text-sm text-gray-600">
                Page <span className="font-semibold">{currentPage}</span> of{" "}
                <span className="font-semibold">{totalPages}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
