import { useState, useEffect, useCallback } from 'react';
import { formatAge } from '../utils/formatters';

const STORAGE_KEY = 'cpf-retirement-clients';

function getClients() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function persistClients(clients) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
}

export default function ClientManager({ currentInputs, setInputs, onSelectClient }) {
  const [clients, setClients] = useState(getClients);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Sync from localStorage on mount
  useEffect(() => {
    setClients(getClients());
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const saveClient = useCallback(() => {
    const name = (currentInputs.name || '').trim();
    if (!name) {
      showToast('Please enter a client name first.', 'error');
      return;
    }

    const existing = clients.find(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      if (!window.confirm(`A client named "${name}" already exists. Update their data?`)) {
        return;
      }
      const updated = clients.map((c) =>
        c.id === existing.id
          ? { ...c, lastModified: new Date().toISOString(), data: { ...currentInputs } }
          : c
      );
      setClients(updated);
      persistClients(updated);
      showToast(`Updated "${name}" successfully.`);
      return;
    }

    const newClient = {
      id: crypto.randomUUID(),
      name,
      lastModified: new Date().toISOString(),
      data: { ...currentInputs },
    };
    const updated = [newClient, ...clients];
    setClients(updated);
    persistClients(updated);
    showToast(`Saved "${name}" successfully.`);
  }, [clients, currentInputs, showToast]);

  const deleteClient = useCallback(
    (id) => {
      const client = clients.find((c) => c.id === id);
      const updated = clients.filter((c) => c.id !== id);
      setClients(updated);
      persistClients(updated);
      setConfirmDeleteId(null);
      showToast(`Deleted "${client?.name}" successfully.`);
    },
    [clients, showToast]
  );

  const loadClient = useCallback(
    (id) => {
      const client = clients.find((c) => c.id === id);
      if (!client) return;
      setInputs(client.data);
      if (onSelectClient) onSelectClient(client);
      showToast(`Loaded "${client.name}" successfully.`);
    },
    [clients, setInputs, onSelectClient, showToast]
  );

  const handleNewClient = useCallback(() => {
    setInputs({
      name: '',
      dob: '',
      gender: 'Male',
      monthlySalary: 0,
      annualBonus: 1,
      salaryIncrement: 0.03,
      statementDate: '',
      oaBalance: 0,
      saBalance: 0,
      maBalance: 0,
      raBalance: 0,
      housingLoan: 0,
      housingTillAge: 0,
      housingStartDate: '',
      cpfisOA: 0,
      cpfisSA: 0,
      cpfisOATillAge: 55,
      cpfisSATillAge: 55,
      shieldIP: false,
      metFRS: false,
      cpfLifePayout: 0,
      desiredMonthlyIncome: 0,
      investmentReturn: 0.025,
      savingsPlans: [],
      investmentPlans: [],
      rentalIncome: [],
      regularPayouts: [],
    });
    showToast('Form cleared for new client.');
  }, [setInputs, showToast]);

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-SG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="mb-4">
      {/* Toggle bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[#1a1a2e] text-white rounded-lg px-4 py-3 shadow-sm hover:bg-[#2d2d44] transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-[#d4af37]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="font-semibold text-sm">Saved Clients</span>
          <span className="bg-[#d4af37] text-[#1a1a2e] text-xs font-bold px-2 py-0.5 rounded-full">
            {clients.length}
          </span>
        </div>
        <svg
          className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible panel */}
      {isOpen && (
        <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-md p-4">
          {/* Action bar */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <button
              onClick={saveClient}
              className="inline-flex items-center gap-1.5 bg-[#1a1a2e] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[#2d2d44] transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              Save Current Client
            </button>
            <button
              onClick={handleNewClient}
              className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-200 transition-colors border border-gray-300"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Client
            </button>
            <div className="flex-1 min-w-[180px]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#1a1a2e] focus:ring-1 focus:ring-[#1a1a2e] focus:outline-none"
              />
            </div>
          </div>

          {/* Client cards */}
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <svg
                className="mx-auto h-10 w-10 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <p className="text-sm">
                {clients.length === 0
                  ? 'No saved clients yet. Save your first client above.'
                  : 'No clients match your search.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((client) => {
                const age = client.data?.dob ? formatAge(client.data.dob) : null;
                const gender = client.data?.gender || '';
                return (
                  <div
                    key={client.id}
                    className="border border-gray-200 rounded-lg p-3 hover:border-[#1a1a2e]/30 hover:shadow-sm transition-all bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {client.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {age != null && `Age ${age}`}
                          {age != null && gender && ' \u00B7 '}
                          {gender}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">
                      Modified: {formatDate(client.lastModified)}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => loadClient(client.id)}
                        className="flex-1 text-xs font-medium bg-[#1a1a2e] text-white px-3 py-1.5 rounded-md hover:bg-[#2d2d44] transition-colors"
                      >
                        Load
                      </button>
                      {confirmDeleteId === client.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => deleteClient(client.id)}
                            className="text-xs font-medium bg-red-600 text-white px-2 py-1.5 rounded-md hover:bg-red-700 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs font-medium bg-gray-200 text-gray-600 px-2 py-1.5 rounded-md hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(client.id)}
                          className="text-xs font-medium bg-red-50 text-red-600 px-3 py-1.5 rounded-md hover:bg-red-100 transition-colors border border-red-200"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
