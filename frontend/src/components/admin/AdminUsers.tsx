import { useEffect, useState, useCallback } from "react";

import api from "../../axios";

type Role = "ADMIN" | "AGENT" | "CLIENT";

interface User {
  enabled: any;
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

interface ModalState {
  type: "deactivate" | "reactivate" | null;
  userId: number | null;
}

const ROLES: Role[] = ["ADMIN", "AGENT", "CLIENT"];

function UserAvatar({ name }: { name: string }) {
  return (
    <div className="user-avatar">
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function StatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <span className={`status-badge ${enabled ? "status-badge--active" : "status-badge--inactive"}`}>
      {enabled ? "Active" : "Deactivated"}
    </span>
  );
}

function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`role-badge role-badge--${role.toLowerCase()}`}>
      {role.charAt(0) + role.slice(1).toLowerCase()}
    </span>
  );
}

function TblBtn({
  children,
  onClick,
  variant = "ghost",
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "ghost" | "purple" | "danger";
}) {
  return (
    <button
      onClick={onClick}
      className={`tbl-btn ${variant === "purple" ? "tbl-btn--purple" : variant === "danger" ? "tbl-btn--danger" : ""}`}
    >
      {children}
    </button>
  );
}

function ConfirmModal({
  modal,
  usersMap,
  onClose,
  onConfirmDeactivate,
  onConfirmReactivate,
}: {
  modal: ModalState;
  usersMap: Record<number, User>;
  onClose: () => void;
  onConfirmDeactivate: (id: number) => void;
  onConfirmReactivate: (id: number) => void;
}) {
  if (!modal.type || !modal.userId) return null;
  const user = usersMap[modal.userId];
  const name = user?.name ?? `User #${modal.userId}`;
  const isDeactivate = modal.type === "deactivate";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {isDeactivate && (
          <div className="modal-icon--danger">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="32" height="32" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        )}
        <h2 className="modal-title">
          {isDeactivate ? "Deactivate account?" : "Reactivate account?"}
        </h2>

        <p className="modal-desc">
          {isDeactivate
            ? <><strong>{name}</strong> will lose access to their account.</>
            : <><strong>{name}</strong> will regain access to their account.</>}
        </p>
        <div className="modal-actions">
          <button className="modal-btn modal-btn--cancel" onClick={onClose}>Cancel</button>
          <button className={`modal-btn ${isDeactivate ? "modal-btn--danger" : "modal-btn--confirm"}`}
            onClick={() => isDeactivate ? onConfirmDeactivate(modal.userId!) : onConfirmReactivate(modal.userId!)}
          >
            {isDeactivate ? "Yes, deactivate" : "Yes, reactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [usersMap, setUsersMap] = useState<Record<number, User>>({});
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [modal, setModal] = useState<ModalState>({ type: null, userId: null });
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    api.get<User[]>("/users")
      .then(({ data }) => {
        setUsers(data);
        const map: Record<number, User> = {};
        data.forEach((u) => (map[u.id] = u));
        setUsersMap(map);
      })
      .catch(() => showToast("Could not load users.", "error"));
  }, []);

  const applyFilters = useCallback(() => {
    const q = search.trim().toLowerCase();
    const result = users.filter((u) => {
      const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      const matchRole = !roleFilter || u.role === roleFilter;
      const matchStatus =
        statusFilter === "all" ? true
        : statusFilter === "active" ? u.enabled
        : !u.enabled;
      return matchSearch && matchRole && matchStatus;
    });
    setFilteredUsers(result);
    setCurrentPage(1);
  }, [users, search, roleFilter]);

  useEffect(() => { applyFilters(); }, [applyFilters]);

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function updateUser(updated: User) {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setUsersMap((prev) => ({ ...prev, [updated.id]: updated }));
  }

  function confirmDeactivate(userId: number) {
    api.patch<User>(`/users/${userId}/deactivate`)
      .then(({ data: updated }) => {
        updateUser(updated);
        setModal({ type: null, userId: null });
        showToast(`"${updated.name}" has been deactivated.`, "success");
      })
      .catch(() => {
        setModal({ type: null, userId: null });
        showToast("Failed to deactivate user.", "error");
      });
  }

  function confirmReactivate(userId: number) {
    api.patch<User>(`/users/${userId}/reactivate`)
      .then(({ data: updated }) => {
        updateUser(updated);
        setModal({ type: null, userId: null });
        showToast(`"${updated.name}" has been reactivated.`, "success");
      })
      .catch(() => {
        setModal({ type: null, userId: null });
        showToast("Failed to reactivate user.", "error");
      });
  }

  const totalPages = Math.ceil(filteredUsers.length / perPage);
  const pageUsers = filteredUsers.slice((currentPage - 1) * perPage, currentPage * perPage);
  const isFiltered = search || roleFilter || statusFilter !== "all";
  const countText = isFiltered
    ? `Showing ${filteredUsers.length} of ${users.length} user${users.length !== 1 ? "s" : ""}`
    : `${users.length} user${users.length !== 1 ? "s" : ""} total`;

  return (
    <div className="main-content">
      <div className="admin-users-header">
        <h1 className="admin-users-title">Users</h1>
        <a href="/admin/users/add" className="admin-users-add-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add user
        </a>
      </div>

      <div className="admin-users-controls">
        <div className="admin-users-search-wrap">
          <svg className="admin-users-search-icon" viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="admin-users-search-input"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="admin-users-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
          ))}
        </select>
        <select className="admin-users-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="deactivated">Deactivated</option>
        </select>
        <select className="admin-users-select" value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}>
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>

      <p className="admin-users-count">{countText}</p>

      <div className="admin-users-table-wrap">
        {filteredUsers.length === 0 ? (
          <p className="admin-users-empty">No users found.</p>
        ) : (
          <table className="admin-users-table">
            <thead>
              <tr>
                <th></th>
                <th>Name / Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageUsers.map((user) => (
                <tr key={user.id} className={!user.enabled ? "is-deactivated" : ""}>
                  <td><UserAvatar name={user.name} /></td>
                  <td>
                    <div className="user-name">{user.name}</div>
                    <div className="user-email">{user.email}</div>
                  </td>
                  <td><RoleBadge role={user.role} /></td>
                  <td><StatusBadge enabled={user.enabled} /></td>
                  <td className="user-date">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td>
                    <div className="row-actions">
                      <TblBtn onClick={() => (window.location.href = `/admin/users/edit/${user.id}`)}>Edit</TblBtn>
                      {user.enabled
                        ? <TblBtn variant="danger" onClick={() => setModal({ type: "deactivate", userId: user.id })}>Deactivate</TblBtn>
                        : <TblBtn variant="purple" onClick={() => setModal({ type: "reactivate", userId: user.id })}>Reactivate</TblBtn>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="admin-users-pagination">
          <button className="pagination-btn" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`pagination-btn ${p === currentPage ? "pagination-btn--active" : ""}`}
              onClick={() => setCurrentPage(p)}
            >
              {p}
            </button>
          ))}
          <button className="pagination-btn" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            Next →
          </button>
        </div>
      )}

      <ConfirmModal
        modal={modal}
        usersMap={usersMap}
        onClose={() => setModal({ type: null, userId: null })}
        onConfirmDeactivate={confirmDeactivate}
        onConfirmReactivate={confirmReactivate}
      />

      {toast && (
        <div className={`toast toast--${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}