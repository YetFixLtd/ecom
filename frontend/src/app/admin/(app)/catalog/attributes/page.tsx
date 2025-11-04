"use client";

import { useEffect, useState, Fragment } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  getAttributes,
  type Attribute,
  type AttributeValue,
  createAttribute,
  updateAttribute,
  deleteAttribute,
  getAttributeValues,
  createAttributeValue,
  updateAttributeValue,
  deleteAttributeValue,
  reorderAttributeValues,
} from "@/lib/apis/attributes";
import { getAdminTokenFromCookies } from "@/lib/cookies";
import { AxiosError } from "axios";
import { CreateAttributeModal } from "@/components/admin/catalog/CreateAttributeModal";
import { EditAttributeModal } from "@/components/admin/catalog/EditAttributeModal";
import { CreateAttributeValueModal } from "@/components/admin/catalog/CreateAttributeValueModal";
import { EditAttributeValueModal } from "@/components/admin/catalog/EditAttributeValueModal";

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
  
  // Attribute values management
  const [expandedAttributes, setExpandedAttributes] = useState<Set<number>>(new Set());
  const [attributeValues, setAttributeValues] = useState<Record<number, AttributeValue[]>>({});
  const [loadingValues, setLoadingValues] = useState<Set<number>>(new Set());
  const [showCreateValueModal, setShowCreateValueModal] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<{ attributeId: number; value: AttributeValue } | null>(null);

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

  const toggleAttributeExpansion = async (attributeId: number) => {
    const isExpanded = expandedAttributes.has(attributeId);
    
    if (isExpanded) {
      // Collapse
      setExpandedAttributes((prev) => {
        const next = new Set(prev);
        next.delete(attributeId);
        return next;
      });
    } else {
      // Expand - fetch values if not already loaded
      setExpandedAttributes((prev) => new Set(prev).add(attributeId));
      
      if (!attributeValues[attributeId]) {
        await fetchAttributeValues(attributeId);
      }
    }
  };

  const fetchAttributeValues = async (attributeId: number) => {
    setLoadingValues((prev) => new Set(prev).add(attributeId));
    
    try {
      const token = await getAdminTokenFromCookies();
      if (!token) return;

      const response = await getAttributeValues(token, attributeId, { size: 100 });
      setAttributeValues((prev) => ({
        ...prev,
        [attributeId]: response.data,
      }));
    } catch (err) {
      if (err instanceof AxiosError) {
        console.error("Failed to fetch attribute values:", err);
      }
    } finally {
      setLoadingValues((prev) => {
        const next = new Set(prev);
        next.delete(attributeId);
        return next;
      });
    }
  };

  const handleDeleteValue = async (attributeId: number, valueId: number, valueName: string) => {
    if (!confirm(`Are you sure you want to delete "${valueName}"?`)) {
      return;
    }

    try {
      const token = await getAdminTokenFromCookies();
      if (!token) return;

      await deleteAttributeValue(token, attributeId, valueId);
      await fetchAttributeValues(attributeId);
    } catch (err) {
      if (err instanceof AxiosError) {
        alert(err.response?.data?.message || "Failed to delete attribute value");
      }
    }
  };

  const handleMoveValue = async (
    attributeId: number,
    valueId: number,
    direction: "up" | "down"
  ) => {
    const values = attributeValues[attributeId] || [];
    const currentIndex = values.findIndex((v) => v.id === valueId);
    
    if (currentIndex === -1) return;
    
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= values.length) return;

    // Swap positions
    const newValues = [...values];
    const temp = newValues[currentIndex];
    newValues[currentIndex] = newValues[newIndex];
    newValues[newIndex] = temp;

    // Update local state immediately
    setAttributeValues((prev) => ({
      ...prev,
      [attributeId]: newValues,
    }));

    // Update backend
    try {
      const token = await getAdminTokenFromCookies();
      if (!token) return;

      await reorderAttributeValues(
        token,
        attributeId,
        {
          values: newValues.map((v, idx) => ({
            id: v.id,
            position: idx + 1,
          })),
        }
      );
    } catch (err) {
      // Revert on error
      await fetchAttributeValues(attributeId);
      if (err instanceof AxiosError) {
        alert(err.response?.data?.message || "Failed to reorder values");
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
                attributes.map((attribute) => {
                  const isExpanded = expandedAttributes.has(attribute.id);
                  const values = attributeValues[attribute.id] || [];
                  const isLoadingValues = loadingValues.has(attribute.id);

                  return (
                    <Fragment key={attribute.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleAttributeExpansion(attribute.id)}
                              className="rounded p-0.5 hover:bg-gray-200"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                            <span className="font-medium">{attribute.name}</span>
                          </div>
                        </td>
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
                              title="Edit attribute"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(attribute)}
                          className="rounded p-1 text-red-600 hover:bg-red-50"
                              title="Delete attribute"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="px-4 py-4 bg-gray-50">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-700">
                                  Attribute Values
                                </h3>
                                <button
                                  onClick={() => setShowCreateValueModal(attribute.id)}
                                  className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700"
                                >
                                  <Plus className="h-3 w-3" />
                                  Add Value
                                </button>
                              </div>

                              {isLoadingValues ? (
                                <div className="text-center py-4 text-sm text-gray-500">
                                  Loading values...
                                </div>
                              ) : values.length === 0 ? (
                                <div className="text-center py-4 text-sm text-gray-500">
                                  No values added yet. Click &quot;Add Value&quot; to create one.
                                </div>
                              ) : (
                                <div className="rounded-md border bg-white">
                                  <table className="w-full">
                                    <thead className="border-b bg-gray-50">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 w-12">
                                          Order
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                                          Value
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                                          Value Key
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                                          Position
                                        </th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">
                                          Actions
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                      {values.map((value, index) => (
                                        <tr key={value.id} className="hover:bg-gray-50">
                                          <td className="px-3 py-2">
                                            <div className="flex gap-1">
                                              <button
                                                onClick={() => handleMoveValue(attribute.id, value.id, "up")}
                                                disabled={index === 0}
                                                className="rounded p-0.5 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="Move up"
                                              >
                                                <ArrowUp className="h-3 w-3" />
                                              </button>
                                              <button
                                                onClick={() => handleMoveValue(attribute.id, value.id, "down")}
                                                disabled={index === values.length - 1}
                                                className="rounded p-0.5 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="Move down"
                                              >
                                                <ArrowDown className="h-3 w-3" />
                                              </button>
                                            </div>
                                          </td>
                                          <td className="px-3 py-2 text-sm font-medium">{value.value}</td>
                                          <td className="px-3 py-2 text-sm text-gray-600">
                                            {value.value_key || "-"}
                                          </td>
                                          <td className="px-3 py-2 text-sm text-gray-600">
                                            {value.position}
                                          </td>
                                          <td className="px-3 py-2">
                                            <div className="flex justify-end gap-2">
                                              <button
                                                onClick={() =>
                                                  setEditingValue({
                                                    attributeId: attribute.id,
                                                    value,
                                                  })
                                                }
                                                className="rounded p-1 text-gray-600 hover:bg-gray-100"
                                                title="Edit value"
                                              >
                                                <Pencil className="h-3 w-3" />
                                              </button>
                                              <button
                                                onClick={() =>
                                                  handleDeleteValue(attribute.id, value.id, value.value)
                                                }
                                                className="rounded p-1 text-red-600 hover:bg-red-50"
                                                title="Delete value"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
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

      {showCreateValueModal && (
        <CreateAttributeValueModal
          attributeId={showCreateValueModal}
          onClose={() => setShowCreateValueModal(null)}
          onSuccess={() => {
            setShowCreateValueModal(null);
            fetchAttributeValues(showCreateValueModal);
          }}
        />
      )}

      {editingValue && (
        <EditAttributeValueModal
          attributeId={editingValue.attributeId}
          attributeValue={editingValue.value}
          onClose={() => setEditingValue(null)}
          onSuccess={() => {
            setEditingValue(null);
            fetchAttributeValues(editingValue.attributeId);
          }}
        />
      )}
    </div>
  );
}

