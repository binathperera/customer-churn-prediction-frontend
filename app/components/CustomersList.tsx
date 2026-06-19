import { useEffect, useState } from "react";
import {
  fetchAllCustomers,
  predictCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
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

const defaultNewCustomer: Partial<Customer> = {
  Surname: "",
  CreditScore: 600,
  Age: 35,
  Tenure: 5,
  Balance: 0,
  NumOfProducts: 1,
  HasCrCard: 1,
  IsActiveMember: 1,
  EstimatedSalary: 50000,
  Geography: "France",
  Gender: "Male",
};

// Risk Classification Helper
const getRiskDetails = (probability: number) => {
  if (probability >= 0.6) {
    return {
      label: "High Risk",
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      lightBg: "bg-red-100",
      iconColor: "text-red-600",
      icon: "⚠️",
      action: "Call immediately",
    };
  } else if (probability >= 0.2) {
    return {
      label: "Medium Risk",
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-800",
      lightBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      icon: "🔔",
      action: "Send loyalty email",
    };
  } else {
    return {
      label: "Low Risk",
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-700",
      lightBg: "bg-green-100",
      iconColor: "text-green-600",
      icon: "✓",
      action: "No action needed",
    };
  }
};

export function CustomersList() {
  const [customers, setCustomers] = useState<CustomerWithPrediction[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [apiHealthy, setApiHealthy] = useState(false);

  // Filter States
  const [filters, setFilters] = useState({
    CustomerId: "",
    Surname: "",
    Age: "",
    Tenure: "",
    Gender: "",
    Geography: "",
    includeExited: false,
  });

  // Add Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] =
    useState<Partial<Customer>>(defaultNewCustomer);
  const [newCustomerPrediction, setNewCustomerPrediction] =
    useState<Prediction | null>(null);
  const [isPredictingNew, setIsPredictingNew] = useState(false);
  const [isSavingNew, setIsSavingNew] = useState(false);
  const [addModalError, setAddModalError] = useState<string | null>(null);

  // View/Edit/Delete Modal States
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<Partial<CustomerWithPrediction> | null>(null);
  const [viewModalError, setViewModalError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      const healthy = await checkAPIHealth();
      setApiHealthy(healthy);
      if (!healthy) {
        setError(
          "Cannot connect to API. Make sure the backend is running on " +
            `${import.meta.env.VITE_API_URL}`,
        );
        setLoading(false);
        return;
      }

      await loadCustomers(1);
    };

    checkHealth();
  }, []);

  const loadCustomers = async (page: number) => {
    try {
      setLoading(true);
      setError(null);

      const offset = (page - 1) * ITEMS_PER_PAGE;
      const apiParams: any = { limit: ITEMS_PER_PAGE, offset };

      if (filters.CustomerId) apiParams.CustomerId = filters.CustomerId;
      if (filters.Surname) apiParams.Surname = filters.Surname;
      if (filters.Age) apiParams.Age = filters.Age;
      if (filters.Tenure) apiParams.Tenure = filters.Tenure;
      if (filters.Gender) apiParams.Gender = filters.Gender;
      if (filters.Geography) apiParams.Geography = filters.Geography;

      if (!filters.includeExited) apiParams.Exited = 0;

      const data = await fetchAllCustomers(apiParams);
      const fetchedCustomers = data.customers || [];

      const customersWithPredictions = await Promise.all(
        fetchedCustomers.map(async (customer) => {
          try {
            const prediction = await predictCustomer(customer);
            return { ...customer, prediction };
          } catch (err) {
            return { ...customer, error: "Prediction missing" };
          }
        }),
      );

      setCustomers(customersWithPredictions);
      setTotalRecords(data.total_filtered_records || 0);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCustomers(1);
  };

  // --- Add Customer Modal Handlers ---
  const handleNewCustomerChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number = value;

    if (type === "number") {
      parsedValue = value === "" ? "" : Number(value);
    } else if (type === "checkbox") {
      parsedValue = (e.target as HTMLInputElement).checked ? 1 : 0;
    }

    setNewCustomer((prev) => ({ ...prev, [name]: parsedValue }));
    setNewCustomerPrediction(null);
  };

  const handlePredictNewCustomer = async () => {
    try {
      setIsPredictingNew(true);
      setAddModalError(null);
      const prediction = await predictCustomer(newCustomer);
      setNewCustomerPrediction(prediction);
    } catch (err) {
      setAddModalError(
        err instanceof Error ? err.message : "Failed to generate prediction",
      );
    } finally {
      setIsPredictingNew(false);
    }
  };

  const handleSaveNewCustomer = async () => {
    try {
      setIsSavingNew(true);
      setAddModalError(null);
      await createCustomer(newCustomer);
      setIsAddModalOpen(false);
      setNewCustomer({ ...defaultNewCustomer });
      setNewCustomerPrediction(null);
      loadCustomers(1);
    } catch (err) {
      setAddModalError(
        err instanceof Error
          ? err.message
          : "Failed to save customer to database",
      );
    } finally {
      setIsSavingNew(false);
    }
  };

  // --- View / Edit / Delete Customer Handlers ---
  const handleOpenViewModal = (customer: CustomerWithPrediction) => {
    setSelectedCustomer({ ...customer });
    setViewModalError(null);
    setIsViewModalOpen(true);
  };

  const handleSelectedCustomerChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number = value;

    if (type === "number") {
      parsedValue = value === "" ? "" : Number(value);
    } else if (type === "checkbox") {
      parsedValue = (e.target as HTMLInputElement).checked ? 1 : 0;
    }

    setSelectedCustomer((prev) =>
      prev ? { ...prev, [name]: parsedValue } : null,
    );
  };

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer) return;
    const targetId = selectedCustomer.id || selectedCustomer.CustomerId;
    if (!targetId) return;

    try {
      setIsSavingEdit(true);
      setViewModalError(null);
      await updateCustomer(targetId, selectedCustomer);
      setIsViewModalOpen(false);
      loadCustomers(currentPage);
    } catch (err) {
      setViewModalError(
        err instanceof Error ? err.message : "Failed to update record",
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;
    const targetId = selectedCustomer.id || selectedCustomer.CustomerId;
    if (!targetId) return;

    if (
      !window.confirm(
        "Are you sure you want to delete this customer record permanently?",
      )
    ) {
      return;
    }

    try {
      setIsDeleting(true);
      setViewModalError(null);
      await deleteCustomer(targetId);
      setIsViewModalOpen(false);
      loadCustomers(currentPage);
    } catch (err) {
      setViewModalError(
        err instanceof Error ? err.message : "Failed to remove record",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalRecords / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

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
                {import.meta.env.VITE_API_URL}
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
      {/* ADD CUSTOMER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-purple-50/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-3xl rounded-xl bg-white shadow-2xl flex flex-col max-h-[95vh]">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center bg-gray-50 rounded-t-xl shrink-0">
              <h2 className="text-xl font-bold text-gray-800">
                Add New Customer
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {addModalError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                  {addModalError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Surname
                  </label>
                  <input
                    type="text"
                    name="Surname"
                    value={newCustomer.Surname}
                    onChange={handleNewCustomerChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Geography
                  </label>
                  <select
                    name="Geography"
                    value={newCustomer.Geography}
                    onChange={handleNewCustomerChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="France">France</option>
                    <option value="Germany">Germany</option>
                    <option value="Spain">Spain</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="Gender"
                    value={newCustomer.Gender}
                    onChange={handleNewCustomerChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    name="Age"
                    value={newCustomer.Age}
                    onChange={handleNewCustomerChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Credit Score
                  </label>
                  <input
                    type="number"
                    name="CreditScore"
                    value={newCustomer.CreditScore}
                    onChange={handleNewCustomerChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tenure (Years)
                  </label>
                  <input
                    type="number"
                    name="Tenure"
                    value={newCustomer.Tenure}
                    onChange={handleNewCustomerChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Balance ($)
                  </label>
                  <input
                    type="number"
                    name="Balance"
                    value={newCustomer.Balance}
                    onChange={handleNewCustomerChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Salary ($)
                  </label>
                  <input
                    type="number"
                    name="EstimatedSalary"
                    value={newCustomer.EstimatedSalary}
                    onChange={handleNewCustomerChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Products
                  </label>
                  <input
                    type="number"
                    name="NumOfProducts"
                    value={newCustomer.NumOfProducts}
                    onChange={handleNewCustomerChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex flex-col space-y-4 justify-center mt-6">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="HasCrCard"
                      id="newHasCrCard"
                      checked={newCustomer.HasCrCard === 1}
                      onChange={handleNewCustomerChange}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label
                      htmlFor="newHasCrCard"
                      className="text-sm font-medium text-gray-700"
                    >
                      Has Credit Card
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="IsActiveMember"
                      id="newIsActiveMember"
                      checked={newCustomer.IsActiveMember === 1}
                      onChange={handleNewCustomerChange}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label
                      htmlFor="newIsActiveMember"
                      className="text-sm font-medium text-gray-700"
                    >
                      Is Active Member
                    </label>
                  </div>
                </div>
              </div>

              {newCustomerPrediction &&
                (() => {
                  const risk = getRiskDetails(
                    newCustomerPrediction.churn_probability,
                  );
                  return (
                    <div
                      className={`mt-6 p-4 rounded-lg border ${risk.bg} ${risk.border}`}
                    >
                      <h3 className="font-semibold text-gray-800 mb-2">
                        Prediction Results:
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className={`text-base font-bold ${risk.text}`}>
                            {risk.icon} {risk.label} (
                            {(
                              newCustomerPrediction.churn_probability * 100
                            ).toFixed(1)}
                            %)
                          </p>
                          <p className="text-sm text-gray-700 mt-1">
                            <strong>Confidence:</strong>{" "}
                            {newCustomerPrediction.confidence.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-700 font-semibold mb-1">
                            Recommended Action:
                          </p>
                          <p
                            className={`text-sm px-3 py-1 inline-block rounded-full font-medium ${risk.lightBg} ${risk.text}`}
                          >
                            Action: {risk.action}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
            </div>

            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-xl flex justify-between items-center shrink-0">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
              >
                Cancel
              </button>
              <div className="space-x-3">
                <button
                  onClick={handlePredictNewCustomer}
                  disabled={isPredictingNew}
                  className="rounded-lg bg-white border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition disabled:opacity-50"
                >
                  {isPredictingNew ? "Predicting..." : "Test Prediction"}
                </button>
                <button
                  onClick={handleSaveNewCustomer}
                  disabled={isSavingNew}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {isSavingNew ? "Saving..." : "Save Customer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW / EDIT / DELETE MODAL */}
      {isViewModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-purple-50/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-3xl rounded-xl bg-white shadow-2xl flex flex-col max-h-[95vh]">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center bg-gray-50 rounded-t-xl shrink-0">
              <h2 className="text-xl font-bold text-gray-800 truncate pr-4">
                Customer Details: {selectedCustomer.Surname}
              </h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {viewModalError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                  {viewModalError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Surname
                  </label>
                  <input
                    type="text"
                    name="Surname"
                    value={selectedCustomer.Surname || ""}
                    onChange={handleSelectedCustomerChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Geography
                  </label>
                  <select
                    name="Geography"
                    value={selectedCustomer.Geography || "France"}
                    onChange={handleSelectedCustomerChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="France">France</option>
                    <option value="Germany">Germany</option>
                    <option value="Spain">Spain</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="Gender"
                    value={selectedCustomer.Gender || "Male"}
                    onChange={handleSelectedCustomerChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    name="Age"
                    value={selectedCustomer.Age || ""}
                    onChange={handleSelectedCustomerChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Credit Score
                  </label>
                  <input
                    type="number"
                    name="CreditScore"
                    value={selectedCustomer.CreditScore || ""}
                    onChange={handleSelectedCustomerChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tenure (Years)
                  </label>
                  <input
                    type="number"
                    name="Tenure"
                    value={selectedCustomer.Tenure ?? ""}
                    onChange={handleSelectedCustomerChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Balance ($)
                  </label>
                  <input
                    type="number"
                    name="Balance"
                    value={selectedCustomer.Balance ?? ""}
                    onChange={handleSelectedCustomerChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Salary ($)
                  </label>
                  <input
                    type="number"
                    name="EstimatedSalary"
                    value={selectedCustomer.EstimatedSalary ?? ""}
                    onChange={handleSelectedCustomerChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Products
                  </label>
                  <input
                    type="number"
                    name="NumOfProducts"
                    value={selectedCustomer.NumOfProducts ?? ""}
                    onChange={handleSelectedCustomerChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex flex-col space-y-3 justify-center mt-6">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="HasCrCard"
                      id="editHasCrCard"
                      checked={selectedCustomer.HasCrCard === 1}
                      onChange={handleSelectedCustomerChange}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label
                      htmlFor="editHasCrCard"
                      className="text-sm font-medium text-gray-700"
                    >
                      Has Credit Card
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="IsActiveMember"
                      id="editIsActiveMember"
                      checked={selectedCustomer.IsActiveMember === 1}
                      onChange={handleSelectedCustomerChange}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label
                      htmlFor="editIsActiveMember"
                      className="text-sm font-medium text-gray-700"
                    >
                      Is Active Member
                    </label>
                  </div>
                </div>
              </div>

              {selectedCustomer.prediction &&
                (() => {
                  const risk = getRiskDetails(
                    selectedCustomer.prediction.churn_probability,
                  );
                  return (
                    <div
                      className={`mt-6 p-4 rounded-lg border ${risk.bg} ${risk.border}`}
                    >
                      <h3 className="font-semibold text-gray-800 mb-2">
                        Current Loaded Churn Prediction:
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className={`text-base font-bold ${risk.text}`}>
                            {risk.icon} {risk.label} (
                            {(
                              selectedCustomer.prediction.churn_probability *
                              100
                            ).toFixed(1)}
                            %)
                          </p>
                          <p className="text-sm text-gray-700 mt-1">
                            <strong>Confidence:</strong>{" "}
                            {selectedCustomer.prediction.confidence.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-700 font-semibold mb-1">
                            Recommended Action:
                          </p>
                          <p
                            className={`text-sm px-3 py-1 inline-block rounded-full font-medium ${risk.lightBg} ${risk.text}`}
                          >
                            Action: {risk.action}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
            </div>

            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-xl flex justify-between items-center shrink-0">
              <button
                onClick={handleDeleteCustomer}
                disabled={isDeleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Customer"}
              </button>
              <div className="space-x-3">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateCustomer}
                  disabled={isSavingEdit}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {isSavingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-indigo-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                Customer Dashboard
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Data Management and Churn Prediction Analysis
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right border-r border-gray-200 pr-6">
                <p className="text-4xl font-bold text-indigo-600">
                  {totalRecords}
                </p>
                <p className="text-gray-600">Filtered Customers</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow hover:bg-indigo-700 transition flex items-center"
              >
                <span className="text-lg mr-2 leading-none">+</span> Add
                Customer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filter Section */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm border border-indigo-100">
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer ID
                </label>
                <input
                  type="text"
                  name="CustomerId"
                  value={filters.CustomerId}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. 15634602"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Surname
                </label>
                <input
                  type="text"
                  name="Surname"
                  value={filters.Surname}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  name="Age"
                  value={filters.Age}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. 40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tenure
                </label>
                <input
                  type="number"
                  name="Tenure"
                  value={filters.Tenure}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. 2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  name="Gender"
                  value={filters.Gender}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  <option value="">All</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <select
                  name="Geography"
                  value={filters.Geography}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  <option value="">All</option>
                  <option value="France">France</option>
                  <option value="Germany">Germany</option>
                  <option value="Spain">Spain</option>
                </select>
              </div>
              <div className="flex items-center space-x-2 py-2">
                <input
                  type="checkbox"
                  name="includeExited"
                  id="includeExited"
                  checked={filters.includeExited}
                  onChange={handleFilterChange}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor="includeExited"
                  className="text-sm text-gray-700"
                >
                  Include Exited
                </label>
              </div>
              <div className="flex justify-end lg:col-span-1">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
                >
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
            <p className="text-xl text-gray-600">
              Loading customers and predictions...
            </p>
          </div>
        ) : error && customers.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow-lg">
            <p className="text-lg text-red-600">{error}</p>
            <button
              onClick={() => loadCustomers(currentPage)}
              className="mt-4 rounded-lg bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700 transition"
            >
              Try Again
            </button>
          </div>
        ) : customers.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow-lg">
            <p className="text-xl text-gray-600">No customers found</p>
            <p className="mt-2 text-gray-500">
              Try adjusting your search filters.
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
                        Churn Prediction
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {customers.map((customer, idx) => {
                      const idKey =
                        customer.CustomerId || customer.id || idx.toString();

                      let risk = null;
                      if (customer.prediction) {
                        risk = getRiskDetails(
                          customer.prediction.churn_probability,
                        );
                      }

                      return (
                        <tr
                          key={idKey}
                          className="hover:bg-indigo-50 transition"
                        >
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
                              {customer.CustomerId || customer.id}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-900">
                                {customer.Surname
                                  ? `${customer.Surname} • `
                                  : ""}
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
                                <span className="font-medium">Status:</span>{" "}
                                {customer.Exited === 1
                                  ? "Exited ⚠️"
                                  : customer.IsActiveMember
                                    ? "Active ✓"
                                    : "Inactive ✗"}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {customer.error ? (
                              <span className="text-sm text-red-500">
                                {customer.error}
                              </span>
                            ) : customer.prediction && risk ? (
                              <div
                                className={`flex items-center space-x-2 rounded-lg px-3 py-2 ${risk.lightBg}`}
                              >
                                <span className={`text-lg ${risk.iconColor}`}>
                                  {risk.icon}
                                </span>
                                <div>
                                  <p
                                    className={`text-sm font-semibold ${risk.text}`}
                                  >
                                    {risk.label}
                                  </p>
                                  <p className={`text-xs ${risk.iconColor}`}>
                                    {(
                                      customer.prediction.churn_probability *
                                      100
                                    ).toFixed(1)}
                                    % Prob.
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <div className="h-2 w-2 animate-pulse rounded-full bg-indigo-500"></div>
                                <span className="text-sm text-gray-400">
                                  Loading...
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleOpenViewModal(customer)}
                              className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="mt-8 flex items-center justify-between rounded-lg bg-white p-6 shadow-lg">
              <div className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-semibold">
                  {totalRecords === 0 ? 0 : startIndex + 1}-
                  {Math.min(startIndex + ITEMS_PER_PAGE, totalRecords)}
                </span>{" "}
                of <span className="font-semibold">{totalRecords}</span>{" "}
                customers
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => loadCustomers(Math.max(1, currentPage - 1))}
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
                        onClick={() => loadCustomers(pageNum)}
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
                    loadCustomers(Math.min(totalPages, currentPage + 1))
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
