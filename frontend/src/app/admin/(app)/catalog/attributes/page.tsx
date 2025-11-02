"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import {
  getAttributes,
  type Attribute,
  createAttribute,
  updateAttribute,
  deleteAttribute,
} from "@/lib/apis/attributes";
import { getAdminTokenFromCookies } from "@/lib/cookies";
import { AxiosError } from "axios";
import { CreateAttributeModal } from "@/components/admin/catalog/CreateAttributeModal";
import { EditAttributeModal } from "@/components/admin/catalog/EditAttributeModal";

export default function AttributesPage() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);

  const fetchAttributes = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAdminTokenFromCookies();
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const params: Record<string, string | number | boolean> = {
        page: currentPage,
        size: 15,
        with_values: true,
      };

      if (search) params.q = search;

      const response = await getAttributes(token, params);
      setAttributes(response.data);
      setTotalPages(response.meta.last_page);
      setTotal(response.meta.total);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to fetch attributes");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchAttributes();
  };

  const handleDelete = async (attribute: Attribute) => {
    if (!confirm(`Are you sure you want to delete ${attribute.name}?`)) {
      return;
    }

    try {
      const token = await getAdminTokenFromCookies();
      if (!token) return;

      await deleteAttribute(token, attribute.id);
      fetchAttributes();
    } catch (err) {
      if (err instanceof AxiosError) {
        alert(err.response?.data?.message || "Failed to delete attribute");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Attributes</h1>
          <p className="text-sm text-gray-600">Manage product attributes and values</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Attribute
        </button>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search attributes..."
            className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            onClick={handleSearch}
            className="rounded-md bg-gray-100 px-4 py-2 hover:bg-gray-200"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                  Slug
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                  Values
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : attributes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                    No attributes found
                  </td>
                </tr>
              ) : (
                attributes.map((attribute) => (
                  <tr key={attribute.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{attribute.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{attribute.slug}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{attribute.type}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {attribute.values_count || 0} values
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingAttribute(attribute)}
                          className="rounded p-1 text-gray-600 hover:bg-gray-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(attribute)}
                          className="rounded p-1 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * 15 + 1} to {Math.min(currentPage * 15, total)} of{" "}
              {total} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateAttributeModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchAttributes();
          }}
        />
      )}

      {editingAttribute && (
        <EditAttributeModal
          attribute={editingAttribute}
          onClose={() => setEditingAttribute(null)}
          onSuccess={() => {
            setEditingAttribute(null);
            fetchAttributes();
          }}
        />
      )}
    </div>
  );
}

