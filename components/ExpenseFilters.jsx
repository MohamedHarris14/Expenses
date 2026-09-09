"use client";

export default function ExpenseFilters({ filters, onChange, categories, payTypes, users }) {
  function update(key, value) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="filters-bar">
      <input
        className="search-input"
        placeholder="Search description"
        value={filters.search}
        onChange={(e) => update("search", e.target.value)}
      />
      <select value={filters.category} onChange={(e) => update("category", e.target.value)}>
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.name} value={c.name}>
            {c.icon} {c.name}
          </option>
        ))}
      </select>
      <select value={filters.paidBy} onChange={(e) => update("paidBy", e.target.value)}>
        <option value="">Everyone</option>
        {users.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
      <select value={filters.payType} onChange={(e) => update("payType", e.target.value)}>
        <option value="">All payment methods</option>
        {payTypes.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={filters.fromDate}
        onChange={(e) => update("fromDate", e.target.value)}
        title="From date"
      />
      <input
        type="date"
        value={filters.toDate}
        onChange={(e) => update("toDate", e.target.value)}
        title="To date"
      />
    </div>
  );
}
