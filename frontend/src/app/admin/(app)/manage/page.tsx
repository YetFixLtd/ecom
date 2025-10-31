import {
  listAdministrators,
  activateAdministrator,
  deactivateAdministrator,
  deleteAdministrator,
} from "@/lib/admin-api";
import type { Administrator } from "@/types/admin";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export const metadata = { title: "Manage Administrators" };

export default async function AdministratorsListPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const page = Number(searchParams.page ?? 1);
  const per_page = Number(searchParams.per_page ?? 15);
  const search =
    typeof searchParams.search === "string" ? searchParams.search : "";
  const role = typeof searchParams.role === "string" ? searchParams.role : "";
  const is_active =
    typeof searchParams.is_active === "string" ? searchParams.is_active : "";

  const resp = await listAdministrators({
    page,
    per_page,
    search,
    role,
    is_active,
  });
  const admins = resp.data;
  const meta = resp.meta;

  async function onActivate(formData: FormData) {
    "use server";
    const id = String(formData.get("id"));
    try {
      await activateAdministrator(id);
      revalidatePath("/admin/manage");
    } catch (error) {
      console.error("Failed to activate:", error);
    }
  }

  async function onDeactivate(formData: FormData) {
    "use server";
    const id = String(formData.get("id"));
    try {
      await deactivateAdministrator(id);
      revalidatePath("/admin/manage");
    } catch (error) {
      console.error("Failed to deactivate:", error);
    }
  }

  async function onDelete(formData: FormData) {
    "use server";
    const id = String(formData.get("id"));
    try {
      await deleteAdministrator(id);
      revalidatePath("/admin/manage");
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manage Administrators</h1>
        <Link
          href="/admin/manage/new"
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          New Administrator
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form method="get" className="flex flex-wrap gap-3">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search by name or email..."
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <select
            name="role"
            defaultValue={role}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
          </select>
          <select
            name="is_active"
            defaultValue={is_active}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Filter
          </button>
          {(search || role || is_active) && (
            <Link
              href="/admin/manage"
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                ID
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                Name
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                Email
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                Role
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                Status
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {admins.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No administrators found.
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{admin.id}</td>
                  <td className="px-4 py-3">
                    {[admin.first_name, admin.last_name]
                      .filter(Boolean)
                      .join(" ") || "—"}
                  </td>
                  <td className="px-4 py-3">{admin.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                      {admin.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {admin.is_active ? (
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/manage/${admin.id}/edit`}
                        className="rounded border border-gray-300 px-3 py-1 text-xs font-medium hover:bg-gray-50"
                      >
                        Edit
                      </Link>
                      {admin.is_active ? (
                        <form action={onDeactivate}>
                          <input type="hidden" name="id" value={admin.id} />
                          <button
                            type="submit"
                            className="rounded border border-orange-300 px-3 py-1 text-xs font-medium text-orange-700 hover:bg-orange-50"
                          >
                            Deactivate
                          </button>
                        </form>
                      ) : (
                        <form action={onActivate}>
                          <input type="hidden" name="id" value={admin.id} />
                          <button
                            type="submit"
                            className="rounded border border-green-300 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
                          >
                            Activate
                          </button>
                        </form>
                      )}
                      <form action={onDelete}>
                        <input type="hidden" name="id" value={admin.id} />
                        <button
                          type="submit"
                          className="rounded border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta.total > meta.per_page && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
          <div className="text-sm text-gray-700">
            Showing {(meta.current_page - 1) * meta.per_page + 1} to{" "}
            {Math.min(meta.current_page * meta.per_page, meta.total)} of{" "}
            {meta.total} results
          </div>
          <div className="flex gap-2">
            {meta.current_page > 1 && (
              <Link
                href={`/admin/manage?page=${meta.current_page - 1}${
                  search ? `&search=${search}` : ""
                }${role ? `&role=${role}` : ""}${
                  is_active ? `&is_active=${is_active}` : ""
                }`}
                className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            <span className="rounded border border-gray-300 px-3 py-1 text-sm">
              Page {meta.current_page} of {meta.last_page}
            </span>
            {meta.current_page < meta.last_page && (
              <Link
                href={`/admin/manage?page=${meta.current_page + 1}${
                  search ? `&search=${search}` : ""
                }${role ? `&role=${role}` : ""}${
                  is_active ? `&is_active=${is_active}` : ""
                }`}
                className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
