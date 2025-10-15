import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getDatabase, ref, onValue, set, get, remove, update } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAClEOj5LYc5qgVgLcA-iKEL98D4RJzTGQ",
  authDomain: "galeria-prueba-6f843.firebaseapp.com",
  databaseURL: "https://galeria-prueba-6f843-default-rtdb.firebaseio.com",
  projectId: "galeria-prueba-6f843",
  storageBucket: "galeria-prueba-6f843.firebasestorage.app",
  messagingSenderId: "274907642671",
  appId: "1:274907642671:web:67b2116697ae5538fdbfda"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// === Referencias DOM ===
const col1 = document.getElementById("col1");
const col2 = document.getElementById("col2");
const col3 = document.getElementById("col3");
const selectedFolder = document.getElementById("selectedFolder");
const inputImgName = document.getElementById("imgName");
const inputImgType = document.getElementById("imgType");
const inputImgFile = document.getElementById("imgFile");
const btnAddImageGlobal = document.getElementById("btnAddImage");
const imageModal = document.getElementById("imageModal");
const modalImg = imageModal.querySelector("img");

let selection1 = null;
let selection2 = null;

// Cerrar modal
imageModal.onclick = () => (imageModal.style.display = "none");

// -------------------- FUNCIONES --------------------

async function ensureNodeExists(path) {
  if (!path) return;
  const snap = await get(ref(db, path));
  if (!snap.exists()) await set(ref(db, path), "string");
}

async function createNode(path, name) {
  const nodePath = path ? `${path}/${name}` : name;
  await ensureNodeExists(path);
  await set(ref(db, nodePath), "string");
  loadColumns();
}

function renderNodes(data) {
  const nodes = [];
  for (let key in data) {
    const val = data[key];
    if (val === "string" || (typeof val === "object" && !("url" in val))) {
      nodes.push({ key, val });
    }
  }
  return nodes;
}

function renderImages(data) {
  const images = [];
  for (let k in data) {
    const v = data[k];
    if (v && typeof v === "object" && "url" in v && "public_id" in v) {
      images.push({ id: k, ...v });
    }
  }
  return images;
}

// === Crear nodo visual ===
function createNodeDiv(name, parentPath, column, dataObj) {
  const div = document.createElement("div");
  div.className = "node";

  const nameSpan = document.createElement("span");
  nameSpan.className = "node-name";
  nameSpan.textContent = name;

  const btnContainer = document.createElement("div");
  btnContainer.className = "node-buttons";

  const makeButton = (icon, title, onClick) => {
    const btn = document.createElement("button");
    btn.textContent = icon;
    btn.title = title;
    btn.onclick = (e) => {
      e.stopPropagation();
      onClick();
    };
    return btn;
  };

  // Crear subnodo
  btnContainer.appendChild(
    makeButton("➕", "Agregar subnodo", async () => {
      const nodeName = prompt("Nombre del nodo:");
      if (!nodeName) return;
      await createNode(parentPath ? `${parentPath}/${name}` : name, nodeName);
    })
  );

  // Editar nodo
  btnContainer.appendChild(
    makeButton("✏️", "Editar nombre", async () => {
      const newName = prompt("Nuevo nombre:", name);
      if (!newName || newName === name) return;
      const oldPath = parentPath ? `${parentPath}/${name}` : name;
      const newPath = parentPath ? `${parentPath}/${newName}` : newName;
      const snap = await get(ref(db, oldPath));
      await set(ref(db, newPath), snap.val());
      await remove(ref(db, oldPath));
      loadColumns();
    })
  );

  // Eliminar nodo
  btnContainer.appendChild(
    makeButton("🗑️", "Eliminar nodo", async () => {
      if (!confirm(`¿Eliminar "${name}" y todo su contenido?`)) return;
      await remove(ref(db, parentPath ? `${parentPath}/${name}` : name));
      loadColumns();
    })
  );

  div.append(nameSpan, btnContainer);

  // Click de selección
  div.onclick = () => {
    if (column === 1) {
      selection1 = name;
      selection2 = null;
      selectedFolder.textContent = "/" + selection1;
      loadCol2(dataObj[name] || {});
    }
    if (column === 2) {
      selection2 = name;
      selectedFolder.textContent = "/" + selection1 + "/" + selection2;
      loadCol3(dataObj[name] || {});
    }
  };

  return div;
}

// === Cargar columnas principales ===
function loadColumns() {
  onValue(ref(db, "/"), (snapshot) => {
    const data = snapshot.val() || {};
    col1.innerHTML = `<div class="column-header">
        <b>Nodos</b> 
        <button onclick="addRootNode()">➕ Añadir Nodo</button>
      </div>`;
    col2.innerHTML = "";
    col3.innerHTML = "";

    const nodes1 = renderNodes(data);
    nodes1.forEach((n) => col1.appendChild(createNodeDiv(n.key, "", 1, data)));
  });
}

window.addRootNode = async () => {
  const name = prompt("Nombre del nodo principal:");
  if (!name) return;
  await createNode("", name);
};

// === Columna 2 ===
function loadCol2(data2) {
  col2.innerHTML = `<div class="column-header">
      <b>Subnodos</b>
      <button onclick="addSubNode()">➕ Añadir Subnodo</button>
    </div>`;
  col3.innerHTML = "";

  const nodes2 = renderNodes(data2);
  nodes2.forEach((n) =>
    col2.appendChild(createNodeDiv(n.key, selection1, 2, data2))
  );

  const imgs = renderImages(data2);
  if (imgs.length) loadCol3(data2);
}

window.addSubNode = async () => {
  if (!selection1) return alert("Selecciona un nodo en columna 1 primero.");
  const name = prompt("Nombre del subnodo:");
  if (!name) return;
  await createNode(selection1, name);
};

// === Columna 3 (Imágenes) ===
function loadCol3(data3) {
  col3.innerHTML = `<div class="column-header"><b>Imágenes</b></div>`;

  const grid = document.createElement("div");
  grid.className = "image-grid";
  col3.appendChild(grid);

  const images = renderImages(data3);
  images.forEach((img) => {
    const card = document.createElement("div");
    card.className = "image-card";

    // Imagen principal
    const imageElem = document.createElement("img");
    imageElem.src = img.url;
    imageElem.alt = img.nombre;
    imageElem.onclick = () => {
      modalImg.src = img.url;
      imageModal.style.display = "flex";
    };
    card.appendChild(imageElem);

    // Botones (arriba derecha)
    const buttonsDiv = document.createElement("div");
    buttonsDiv.className = "image-buttons";

    const btnEdit = document.createElement("button");
    btnEdit.textContent = "✏️";
    btnEdit.title = "Editar imagen";
    btnEdit.onclick = async (e) => {
      e.stopPropagation();
      const newNombre = prompt("Nuevo nombre:", img.nombre) || img.nombre;
      const newTipo = prompt("Nuevo tipo:", img.tipo) || img.tipo;
      await update(ref(db, `${selection1}/${selection2}/${img.id}`), {
        nombre: newNombre,
        tipo: newTipo
      });
    };
    buttonsDiv.appendChild(btnEdit);

    const btnDel = document.createElement("button");
    btnDel.textContent = "🗑️";
    btnDel.title = "Eliminar imagen";
    btnDel.onclick = async (e) => {
      e.stopPropagation();
      if (!confirm(`¿Eliminar "${img.nombre}" de Firebase y Cloudinary?`)) return;

      try {
        const res = await fetch(
          `https://gestor-nodos.onrender.com/delete/${img.public_id}`,
          { method: "DELETE" }
        );
        const result = await res.json();
        if (result.success) {
          await remove(ref(db, `${selection1}/${selection2}/${img.id}`));
          alert("Imagen eliminada correctamente.");
        } else alert("Error al eliminar de Cloudinary: " + result.error);
      } catch {
        alert("Error al conectar con el servidor de eliminación.");
      }
    };
    buttonsDiv.appendChild(btnDel);

    card.appendChild(buttonsDiv);

    // Información de la imagen
    const info = document.createElement("div");
    info.className = "image-info";
    info.innerHTML = `<b>${img.nombre}</b><span>${img.tipo}</span>`;
    card.appendChild(info);

    grid.appendChild(card);
  });
}

// === Subir imagen ===
btnAddImageGlobal.addEventListener("click", async () => {
  if (!selection1 || !selection2)
    return alert("Selecciona un nodo en columnas 1 y 2 primero.");
  const folderPath = `${selection1}/${selection2}`;
  const file = inputImgFile.files[0];
  const nombre = inputImgName.value.trim();
  const tipo = inputImgType.value.trim();
  if (!file || !nombre || !tipo)
    return alert("Completa nombre, tipo y selecciona un archivo.");

  const snap = await get(ref(db, folderPath));
  if (snap.exists() && snap.val() === "string") await set(ref(db, folderPath), {});

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "imagenesxm21");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/dmmppqvjt/image/upload`,
    { method: "POST", body: formData }
  );
  const data = await res.json();
  if (!data.secure_url) return alert("Error al subir a Cloudinary");

  const id = Date.now();
  await set(ref(db, `${folderPath}/${id}`), {
    nombre,
    tipo,
    url: data.secure_url,
    public_id: data.public_id
  });

  inputImgFile.value = "";
  inputImgName.value = "";
  inputImgType.value = "";
  loadColumns();
});

loadColumns();
