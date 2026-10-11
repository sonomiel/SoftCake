import { Routes, Route } from "react-router-dom";

import Inicio from "./components/inicio";

import Emisor from "./components/catalogos/emisor/emisor";

import Clientes from "./components/catalogos/clientes/clientes";

import MainLayout from "./components/mainlayout";
import PrivateRoute from "./components/privateroute/privateroute";
import Login from "./components/login";

import Proveedores from "./components/catalogos/proveedores/proveedor";
import Area_produccion from "./components/catalogos/area_produccion/area_produccion";
import Tipos_proveedores from "./components/catalogos/tipo_proveedor/tipo_proveedor";
import Usuarios from "./components/catalogos/usuarios/usuarios";
import Metodo_Pago from "./components/catalogos/metodo_pago/metodo_pago";
import Insumos from "./components/insumos/insumos";
import Conceptos_movimientos from "./components/catalogos/conceptos_movimientos/conceptos_movimientos";
import Familias from "./components/catalogos/familia/familia";
import Almacenes from "./components/catalogos/almacenes/almacenes";
import Tipos_almacenes from "./components/catalogos/tipo-almacen/tipos_almacenes";
import Unidad_medida from "./components/catalogos/unidad_medida/unidad_medida";
import Entradas_salidas from "./components/entradas_salidas/entradas_salidas.jsx";
import Inventario from "./components/inventario/inventario.jsx";
import Categorias from "./components/catalogos/categorias/categorias";
import Subcategorias from "./components/catalogos/subcategorias/subcategorias";
import Tipo_producto from "./components/catalogos/tipo_producto/tipo_producto.jsx";
import Producto_carta from "./components/producto_carta/producto_carta.jsx";
import Receta from "./components/receta/receta.jsx";
import Carta from "./components/carta/carta.jsx";
import Mod_compl from "./components/modificadores_complementos/mod_compl.jsx";
import Modificadores from "./components/catalogos/modificadores/modificadores.jsx";
import Complementos from "./components/catalogos/complementos/complementos.jsx";
import Pedido from "./components/pedidos/pedido.jsx";
import Gastos from "./components/gastos/gastos";
import Seguridad from "./components/seguridad/seguridad.jsx"
import Apertura from "./components/caja/apertura/apertura.jsx";
import Cierre from "./components/caja/cierre/cierre";
import Reportes from "./components/reportes/reportes.jsx";
import Transferencias from "./components/transferencias/transferencias.jsx";
import Asignados from "./components/pedidos/asignados/asignados.jsx";
import Produciendo from "./components/pedidos/produciendo/produciendo.jsx";
import Terminado from "./components/pedidos/terminado/terminado.jsx";
import Pendiente from "./components/pedidos/pendiente/pendiente.jsx";
import Ordenes from "./components/ordenes/ordenes.jsx";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>

          {/* Ruta de inicio */}
          <Route index element={<Inicio />} />
          <Route path="insumos" element={<Insumos />} />
          <Route path="entradas-salidas" element={<Entradas_salidas />} />
          <Route path="inventario" element={<Inventario />} />
          <Route path="producto-carta" element={<Producto_carta />} />
          <Route path="carta" element={<Carta />} />
          <Route path="receta" element={<Receta />} />
          <Route path="mod_compl" element={<Mod_compl />} />
          <Route path="gastos" element={<Gastos />} />
          <Route path="apertura-caja" element={<Apertura />} />
          <Route path="cierre-caja" element={<Cierre />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="transferencias" element={<Transferencias />} />
          <Route path="ordenes" element={<Ordenes />} />

          <Route path="pedidos"  >
            <Route index element={<Pedido />} />
            <Route path="asignados" element={<Asignados />} />
            <Route path="produciendo" element={<Produciendo />} />
            <Route path="terminado" element={<Terminado />} />
            <Route path="pendientes" element={<Pendiente />} />
          </Route>

          <Route path="catalogos">
            <Route path="almacenes" element={<Almacenes /> } />
            <Route path="area-produccion" element={<Area_produccion />} />
            <Route path="categorias" element={<Categorias />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="complementos" element={<Complementos />} />
            <Route path="conceptos-movimientos" element={<Conceptos_movimientos /> } />
            <Route path="emisor" element={<Emisor />} />
            <Route path="familias" element={<Familias />} />
            <Route path="metodo_pago" element={<Metodo_Pago />} />
            <Route path="modificadores" element={<Modificadores />} />
            <Route path="proveedores" element={<Proveedores />} />
            <Route path="subcategorias" element={<Subcategorias />} />
            <Route path="tipos-almacenes" element={<Tipos_almacenes />} />
            <Route path="tipos-productos" element={<Tipo_producto />} />
            <Route path="tipos_proveedores" element={<Tipos_proveedores />} />
            <Route path="unidad-medida"element={<Unidad_medida />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="seguridad" element={<Seguridad />} />
          </Route>

        </Route>
      </Route>
    </Routes>
  );
}

export default App;