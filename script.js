// Enhanced Dashboard Script with Full Functionality
document.addEventListener("DOMContentLoaded", () => {
  const sections = ["removals", "interventions", "installations", "remarks"];

  // Utility functions
  function escapeHtml(str = '') {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB');
  }

  function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
      <button class="notification-close">&times;</button>
    `;
    
    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 8px;
      max-width: 400px;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // Manual close
    notification.querySelector('.notification-close').onclick = () => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    };
  }

  // Helper to build a table row element from a data object
  function createRowElement(section, row, index) {
    const tr = document.createElement("tr");
    tr.dataset.index = index;
    
    if (section === "remarks") {
      const severity = (row.severity || "").toLowerCase();
      const severityClass = severity === "high" ? "high" : severity === "medium" ? "medium" : severity === "low" ? "low" : "";
      const statusClass = (row.status || "").toLowerCase().replace(/\s+/g, '-');
      
      tr.innerHTML = `
        <td contenteditable="false">${escapeHtml(row.company || "")}</td>
        <td contenteditable="false">${escapeHtml(row.reg || "")}</td>
        <td contenteditable="false">${formatDate(row.date)}</td>
        <td contenteditable="false">${escapeHtml(row.type || "")}</td>
        <td contenteditable="false"><span class="badge ${severityClass}">${escapeHtml(row.severity || "")}</span></td>
        <td contenteditable="false"><span class="badge ${statusClass}">${escapeHtml(row.status || "")}</span></td>
      `;
    } else {
      const statusClass = (row.status || "").toLowerCase().replace(/\s+/g, '-');
      tr.innerHTML = `
        <td contenteditable="false">${escapeHtml(row.company || "")}</td>
        <td contenteditable="false">${escapeHtml(row.reg || "")}</td>
        <td contenteditable="false">${formatDate(row.date)}</td>
        <td contenteditable="false">${escapeHtml(row.location || "")}</td>
        <td contenteditable="false"><span class="badge ${statusClass}">${escapeHtml(row.status || "")}</span></td>
      `;
    }
    return tr;
  }

  // Set dataset.index for each row in tbody
  function refreshIndexes(tbody) {
    Array.from(tbody.querySelectorAll("tr")).forEach((tr, i) => {
      tr.dataset.index = i;
    });
  }

  // Build row object from tr depending on section
  function readRowDataFromTr(section, tr) {
    const cells = tr.children;
    if (section === "remarks") {
      return {
        company: cells[0]?.textContent.trim() || "",
        reg: cells[1]?.textContent.trim() || "",
        date: cells[2]?.textContent.trim() || "",
        type: cells[3]?.textContent.trim() || "",
        severity: cells[4]?.textContent.trim() || "",
        status: cells[5]?.textContent.trim() || ""
      };
    } else {
      return {
        company: cells[0]?.textContent.trim() || "",
        reg: cells[1]?.textContent.trim() || "",
        date: cells[2]?.textContent.trim() || "",
        location: cells[3]?.textContent.trim() || "",
        status: cells[4]?.textContent.trim() || ""
      };
    }
  }

  // Attach click / double-click / keyboard handlers to a row
  function attachRowHandlers(tr, section, tbody) {
    // Select on click
    tr.addEventListener("click", (e) => {
      // Ignore clicks when editing a cell
      if (tr.querySelector("[contenteditable='true']")) return;
      
      // Toggle selection
      if (e.ctrlKey || e.metaKey) {
        tr.classList.toggle("selected");
      } else {
        document.querySelectorAll("tbody tr.selected").forEach(r => r.classList.remove("selected"));
        tr.classList.add("selected");
      }
    });

    // Double-click to edit a cell
    tr.addEventListener("dblclick", (e) => {
      const td = e.target.closest("td");
      if (!td) return;
      
      // Don't edit badge cells
      if (td.querySelector('.badge')) {
        const badge = td.querySelector('.badge');
        const originalText = badge.textContent;
        badge.style.display = 'none';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = originalText;
        input.style.cssText = 'width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 4px;';
        td.appendChild(input);
        input.focus();
        input.select();
        
        const finishEdit = () => {
          badge.textContent = input.value;
          badge.style.display = '';
          input.remove();
          
          // Update the row data
          const index = Number(tr.dataset.index);
          const updatedRow = readRowDataFromTr(section, tr);
          saveRowEdit(section, index, updatedRow);
        };
        
        input.addEventListener('blur', finishEdit);
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') finishEdit();
          if (e.key === 'Escape') {
            badge.style.display = '';
            input.remove();
          }
        });
        return;
      }
      
      td.contentEditable = "true";
      td.spellcheck = false;
      td.focus();

      // Place caret at end
      const range = document.createRange();
      range.selectNodeContents(td);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    // When a cell loses focus, save edit
    tr.addEventListener("focusout", async (e) => {
      const td = e.target.closest("td");
      if (!td || td.contentEditable !== "true") return;
      
      td.contentEditable = "false";
      const index = Number(tr.dataset.index);
      const updatedRow = readRowDataFromTr(section, tr);
      await saveRowEdit(section, index, updatedRow);
    });

    // Support Enter key to finish editing a cell
    tr.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && document.activeElement?.isContentEditable) {
        e.preventDefault();
        document.activeElement.blur();
      }
      if (e.key === "Escape" && document.activeElement?.isContentEditable) {
        e.preventDefault();
        document.activeElement.blur();
      }
    });

    // Context menu for delete
    tr.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      if (confirm("Delete this row?")) {
        deleteRow(section, tr, tbody);
      }
    });
  }

  // Save row edit
  async function saveRowEdit(section, index, updatedRow) {
    try {
      const res = await fetch(`/api/${section}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index, row: updatedRow })
      });
      
      if (res.ok) {
        showNotification("Row updated successfully", "success");
      } else {
        throw new Error(`Server error: ${res.status}`);
      }
    } catch (err) {
      console.error("Failed to save edit:", err);
      showNotification("Failed to save changes", "error");
    }
  }

  // Delete a row
  async function deleteRow(section, tr, tbody) {
    const index = Number(tr.dataset.index);
    
    try {
      const res = await fetch(`/api/${section}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index })
      });
      
      if (res.ok) {
        tr.remove();
        refreshIndexes(tbody);
        showNotification("Row deleted successfully", "success");
      } else {
        throw new Error(`Server error: ${res.status}`);
      }
    } catch (err) {
      console.error("Failed to delete row:", err);
      showNotification("Failed to delete row", "error");
    }
  }

  // Load data for each section
  async function loadSectionData(section) {
    const tbody = document.querySelector(`section[data-section="${section}"] tbody`);
    if (!tbody) return;

    try {
      const res = await fetch(`/api/${section}`);
      if (!res.ok) throw new Error(`Failed to load ${section}`);
      
      const data = await res.json();
      tbody.innerHTML = "";
      
      if (data.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="${section === 'remarks' ? 6 : 5}" class="text-center text-muted">
              No data available. Click "Add New" to create your first entry.
            </td>
          </tr>
        `;
        return;
      }
      
      data.forEach((row, i) => {
        const tr = createRowElement(section, row, i);
        tbody.appendChild(tr);
        attachRowHandlers(tr, section, tbody);
      });
      
    } catch (err) {
      console.error(`Error loading ${section}:`, err);
      tbody.innerHTML = `
        <tr>
          <td colspan="${section === 'remarks' ? 6 : 5}" class="text-center" style="color: #ef4444;">
            <i class="fas fa-exclamation-triangle"></i> Failed to load data
          </td>
        </tr>
      `;
    }
  }

  // Initialize all sections
  sections.forEach(loadSectionData);

  // Search functionality
  document.querySelectorAll('.search-input').forEach(input => {
    input.addEventListener('keyup', function() {
      const query = this.value.toLowerCase();
      const section = this.dataset.section;
      const rows = document.querySelectorAll(`section[data-section="${section}"] tbody tr`);
      
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
      });
    });
  });

  // Sorting functionality
  document.querySelectorAll(".sortable th").forEach(header => {
    header.addEventListener("click", () => {
      const table = header.closest("table");
      const index = Array.from(header.parentNode.children).indexOf(header);
      const rows = Array.from(table.querySelectorAll("tbody tr"));
      const isAscending = !header.classList.contains("asc");
      
      // Remove sort classes from all headers
      table.querySelectorAll("th").forEach(th => th.classList.remove("asc", "desc"));
      
      // Add appropriate class to current header
      header.classList.add(isAscending ? "asc" : "desc");

      rows.sort((a, b) => {
        const aText = a.children[index]?.textContent.trim() || "";
        const bText = b.children[index]?.textContent.trim() || "";

        // Try to parse as date
        const aDate = new Date(aText);
        const bDate = new Date(bText);
        if (!isNaN(aDate) && !isNaN(bDate)) {
          return isAscending ? aDate - bDate : bDate - aDate;
        }

        // Try to parse as number
        const aNum = parseFloat(aText);
        const bNum = parseFloat(bText);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return isAscending ? aNum - bNum : bNum - aNum;
        }

        // String comparison
        return isAscending ? aText.localeCompare(bText) : bText.localeCompare(aText);
      });

      const tbody = table.querySelector("tbody");
      rows.forEach(row => tbody.appendChild(row));
      refreshIndexes(tbody);
    });
  });

  // Add new row functionality
  document.querySelectorAll(".btn-primary").forEach(btn => {
    btn.addEventListener("click", async () => {
      const section = btn.getAttribute("data-section") || btn.closest("section")?.getAttribute("data-section");
      if (!section) return;

      const tbody = document.querySelector(`section[data-section="${section}"] tbody`);
      if (!tbody) return;

      const today = new Date().toISOString().slice(0, 10);
      let payload;

      if (section === "remarks") {
        payload = {
          company: "New Company",
          reg: "NEW123",
          date: today,
          type: "General",
          severity: "Low",
          status: "Open"
        };
      } else {
        payload = {
          company: "New Company",
          reg: "NEW123",
          date: today,
          location: "Port Louis",
          status: "Pending"
        };
      }

      try {
        const res = await fetch(`/api/${section}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`Failed to add row: ${res.status}`);

        const result = await res.json();
        const rowData = result.data || payload;
        
        // Clear "no data" message if present
        if (tbody.querySelector('td[colspan]')) {
          tbody.innerHTML = '';
        }
        
        const tr = createRowElement(section, rowData, tbody.children.length);
        tbody.appendChild(tr);
        refreshIndexes(tbody);
        attachRowHandlers(tr, section, tbody);
        
        tr.scrollIntoView({ behavior: "smooth", block: "center" });
        showNotification("New row added successfully", "success");
        
      } catch (err) {
        console.error("Error adding row:", err);
        showNotification("Failed to add new row", "error");
      }
    });
  });

  // Global functions for button actions
  window.exportData = function(section) {
    const table = document.querySelector(`section[data-section="${section}"] table`);
    if (!table) return;
    
    const rows = Array.from(table.querySelectorAll('tr'));
    const csv = rows.map(row => {
      const cells = Array.from(row.querySelectorAll('th, td'));
      return cells.map(cell => {
        const text = cell.textContent.trim();
        return `"${text.replace(/"/g, '""')}"`;
      }).join(',');
    }).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${section}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification(`${section} data exported successfully`, "success");
  };

  window.deleteSelected = function(section) {
    const selectedRows = document.querySelectorAll(`section[data-section="${section}"] tbody tr.selected`);
    if (selectedRows.length === 0) {
      showNotification("No rows selected", "error");
      return;
    }
    
    if (!confirm(`Delete ${selectedRows.length} selected row(s)?`)) return;
    
    const tbody = document.querySelector(`section[data-section="${section}"] tbody`);
    let deletedCount = 0;
    
    selectedRows.forEach(async (row) => {
      const index = Number(row.dataset.index);
      try {
        const res = await fetch(`/api/${section}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ index })
        });
        
        if (res.ok) {
          row.remove();
          deletedCount++;
          if (deletedCount === selectedRows.length) {
            refreshIndexes(tbody);
            showNotification(`${deletedCount} row(s) deleted successfully`, "success");
          }
        }
      } catch (err) {
        console.error("Failed to delete row:", err);
      }
    });
  };

  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    .notification-close {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      font-size: 18px;
      padding: 0;
      margin-left: 8px;
    }
  `;
  document.head.appendChild(style);
});