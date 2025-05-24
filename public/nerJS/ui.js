// ui.js
export function showAnnotations(data) {
    const container = document.getElementById("annotationsContainer");
    const table = document.createElement("table");
    table.className = "min-w-full table-auto border-collapse border border-gray-300";
  
    const headerRow = document.createElement("tr");
    headerRow.className = "bg-gray-200 text-left";
    headerRow.innerHTML = `
      <th class="border border-gray-300 px-4 py-2">Text</th>
      <th class="border border-gray-300 px-4 py-2">Label</th>
    `;
    table.appendChild(headerRow);
  
    data.forEach(value => {
      const row = document.createElement("tr");
      row.className = "hover:bg-gray-50";
      row.innerHTML = `
        <td class="border border-gray-300 px-4 py-2">${value.text}</td>
        <td class="border border-gray-300 px-4 py-2">${value.label}</td>
      `;
      table.appendChild(row);
    });
  
    container.innerHTML = "";
    container.appendChild(table);
  }
  