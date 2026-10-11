import React, { useState, useRef } from 'react';  // ← agregar useRef
import { Menu } from 'primereact/menu';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { useAuth } from './context/useAuth';
import { MODULOS } from './constants/permisos';
import { usePermisos } from './context/permisoscontext';
import VigenciaUsuario from './diasrestantes';
import './Sidebar.css';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout: logoutAuth, usuario } = useAuth();
    const { tieneModulo } = usePermisos();

    const [catalogosExpandido, setCatalogosExpandido] = useState(true);
    const [pedidosExpandido,   setPedidosExpandido]   = useState(false);
    const [mobileOpen,         setMobileOpen]         = useState(false);

    // ✅ Refs para preservar scroll en desktop y mobile por separado
    const scrollDesktopRef = useRef(null);
    const scrollMobileRef  = useRef(null);

    const handleLogout = () => { logoutAuth(); navigate('/login'); };
    const navegar = (ruta) => { navigate(ruta); setMobileOpen(false); };
    const activo  = (ruta) => location.pathname === ruta ? 'p-menuitem-active' : '';

    const conSeparador = (items) => {
        const filtrados = items.filter(Boolean);
        return filtrados.length > 0 ? [...filtrados, { separator: true }] : [];
    };

    const getMenuItems = () => [
        {
            label: 'Inicio',
            icon: 'pi pi-home',
            command: () => navegar('/'),
            className: activo('/')
        },
        ...(tieneModulo(MODULOS.APERTURA_CAJA) ? [{
            label: 'Apertura de Caja',
            icon: 'pi pi-lock-open',
            command: () => navegar('/apertura-caja'),
            className: activo('/apertura-caja')
        }] : []),
        ...(tieneModulo(MODULOS.CORTE_CAJA) ? [{
            label: 'Corte de Caja',
            icon: 'pi pi-lock',
            command: () => navegar('/cierre-caja'),
            className: activo('/cierre-caja')
        }] : []),
        ...(tieneModulo(MODULOS.CARTA) ? [{
            label: 'Vender',
            icon: 'pi pi-book',
            command: () => navegar('/carta'),
            className: activo('/carta')
        }] : []),
        // ...(tieneModulo(MODULOS.COMPLEMENTOS_MODIFICADORES) ? [{
        //     label: 'Complementos y Modificadores',
        //     icon: 'pi pi-qrcode',
        //     command: () => navegar('/mod_compl'),
        //     className: activo('/mod_compl')
        // }] : []),
        ...(tieneModulo(MODULOS.ENTRADAS_SALIDAS) ? [{
            label: 'Entradas y Salidas',
            icon: 'pi pi-arrow-right-arrow-left',
            command: () => navegar('/entradas-salidas'),
            className: activo('/entradas-salidas')
        }] : []),
        ...(tieneModulo(MODULOS.GASTOS) ? [{
            label: 'Gastos',
            icon: 'pi pi-money-bill',
            command: () => navegar('/gastos'),
            className: activo('/gastos')
        }] : []),
        ...(tieneModulo(MODULOS.INSUMOS) ? [{
            label: 'Insumos',
            icon: 'pi pi-cart-arrow-down',
            command: () => navegar('/insumos'),
            className: activo('/insumos')
        }] : []),
        ...(tieneModulo(MODULOS.ORDEN_DE_COMPRA) ? [{
            label: 'Ordenes de Compra',
            icon: 'pi pi-shopping-cart',
            command: () => navegar('/ordenes'),
            className: activo('/ordenes')
        }] : []),
        ...(tieneModulo(MODULOS.RECETA) ? [{
            label: 'Receta',
            icon: 'pi pi-pen-to-square',
            command: () => navegar('/receta'),
            className: activo('/receta')
        }] : []),
        ...(tieneModulo(MODULOS.REPORTES) ? [{
            label: 'Reportes',
            icon: 'pi pi-chart-bar',
            command: () => navegar('/reportes'),
            className: activo('/reportes')
        }] : []),
        ...(tieneModulo(MODULOS.INVENTARIO) ? [{
            label: 'Reporte de Inventario',
            icon: 'pi pi-check-square',
            command: () => navegar('/inventario'),
            className: activo('/inventario')
        }] : []),
        ...(tieneModulo(MODULOS.TRANSFERENCIAS) ? [{
            label: 'Transferencias',
            icon: 'pi pi-arrow-up-right-and-arrow-down-left-from-center',
            command: () => navegar('/transferencias'),
            className: activo('/transferencias')   // ← también corregido (era classNames)
        }] : []),
    ];

    const getPedidosItems = () => {
        if (!tieneModulo(MODULOS.PEDIDOS)) return [];
        return [
            {
                label: 'Nuevo Pedido',
                icon: 'pi pi-folder-open',
                command: () => navegar('/pedidos'),
                className: activo('/pedidos')
            },
            {
                label: 'Asignado',
                icon: 'pi pi-user-plus',
                command: () => navegar('/pedidos/asignados'),
                className: activo('/pedidos/asignados')
            },
            {
                label: 'Produciendo',
                icon: 'pi pi-spin pi-cog',
                command: () => navegar('/pedidos/produciendo'),
                className: activo('/pedidos/produciendo')
            },
            {
                label: 'Terminado',
                icon: 'pi pi-check-circle',
                command: () => navegar('/pedidos/terminado'),
                className: activo('/pedidos/terminado')
            },
            {
                label: 'Pendientes',
                icon: 'pi pi-exclamation-circle',
                command: () => navegar('/pedidos/pendientes'),
                className: activo('/pedidos/pendientes')
            },
        ];
    };

    const getCatalogosItems = () => {
        const items = [
            ...conSeparador([
                tieneModulo(MODULOS.ALMACEN) && { label: 'Almacenes', icon: 'pi pi-building', command: () => navegar('/catalogos/almacenes') },
                tieneModulo(MODULOS.TIPO_ALMACEN) && { label: 'Tipos Almacenes', icon: 'pi pi-clone', command: () => navegar('/catalogos/tipos-almacenes') },
            ]),
            ...conSeparador([
                tieneModulo(MODULOS.PROVEEDORES) && { label: 'Proveedores', icon: 'pi pi-briefcase', command: () => navegar('/catalogos/proveedores') },
                tieneModulo(MODULOS.TIPO_PROVEEDOR) && { label: 'Tipos de Proveedores', icon: 'pi pi-sitemap', command: () => navegar('/catalogos/tipos_proveedores') },
            ]),     
            ...conSeparador([
                tieneModulo(MODULOS.EMISOR) && { label: 'Emisor', icon: 'pi pi-id-card', command: () => navegar('/catalogos/emisor') },
                tieneModulo(MODULOS.METODO_PAGO) && { label: 'Metodo de Pago', icon: 'pi pi-money-bill', command: () => navegar('/catalogos/metodo_pago') },
                tieneModulo(MODULOS.CONCEPTO_MOVIMIENTO) && { label: 'Concepto de Movimientos', icon: 'pi pi-book', command: () => navegar('/catalogos/conceptos-movimientos') },
            ]),
            ...conSeparador([
                // tieneModulo(MODULOS.COMPLEMENTOS) && { label: 'Complementos', icon: 'pi pi-plus-circle', command: () => navegar('/catalogos/complementos') },
                tieneModulo(MODULOS.MODIFICADORES) && { label: 'Modificadores', icon: 'pi pi-pencil', command: () => navegar('/catalogos/modificadores') },
            ]),
            ...conSeparador([
                tieneModulo(MODULOS.PRODUCTOS_DE_CARTA) && { label: 'Alta de Articulo', icon: 'pi pi-map', command: () => navegar('/producto-carta'), className: activo('/producto-carta') },
                tieneModulo(MODULOS.CATEGORIA) && { label: 'Categorias', icon: 'pi pi-bars', command: () => navegar('/catalogos/categorias') },
                tieneModulo(MODULOS.SUBCATEGORIA) && { label: 'Subcategorias', icon: 'pi pi-ellipsis-h', command: () => navegar('/catalogos/subcategorias') },
                tieneModulo(MODULOS.FAMILIAS) && { label: 'Familias', icon: 'pi pi-comments', command: () => navegar('/catalogos/familias') },
                tieneModulo(MODULOS.TIPO_PRODUCTOS) && { label: 'Tipos Productos', icon: 'pi pi-map', command: () => navegar('/catalogos/tipos-productos') },
                tieneModulo(MODULOS.UNIDAD_MEDIDA) && { label: 'Unidades de Medida', icon: 'pi pi-clone', command: () => navegar('/catalogos/unidad-medida') },
                tieneModulo(MODULOS.AREA_PRODUCCION) && { label: 'Area de Produccion', icon: 'pi pi-inbox', command: () => navegar('/catalogos/area-produccion') },
            ]),
            ...conSeparador([
                tieneModulo(MODULOS.CLIENTES) && { label: 'Clientes', icon: 'pi pi-users', command: () => navegar('/catalogos/clientes') },
            ]),
            ...[
                tieneModulo(MODULOS.USUARIOS) && { label: 'Usuarios', icon: 'pi pi-user-edit', command: () => navegar('/catalogos/usuarios') },
                tieneModulo(MODULOS.SEGURIDAD) && { label: 'Seguridad', icon: 'pi pi-lock', command: () => navegar('/catalogos/seguridad') },
            ].filter(Boolean),
        ];

        return items.filter((item, index, arr) => {
            if (!item.separator) return true;
            const siguiente = arr[index + 1];
            return siguiente && !siguiente.separator;
        });
    };

    // ✅ JSX del contenido — ya NO es un componente interno, es una función que
    //    recibe el ref del scroll para preservarlo entre renders
    const renderSidebarContent = (scrollRef) => (
        <div className="sidebar-container h-screen flex flex-column shadow-2">
            {/* Header */}
            <div className="sidebar-header p-3 flex align-items-center gap-2">
                <i className="pi pi-shopping-bag text-2xl"></i>
                <span className="text-xs">Sistema de Venta</span>
                <Button
                    icon="pi pi-times"
                    className="p-button-text p-button-sm ml-auto sidebar-close-btn"
                    onClick={() => setMobileOpen(false)}
                    type="button"
                />
            </div>

            {/* Usuario */}
            <div className="user-info p-3">
                <div className="flex align-items-center gap-2 mb-2">
                    <Avatar
                        label={usuario?.username?.charAt(0)?.toUpperCase() || 'U'}
                        size="large"
                        shape="circle"
                    />
                    <div className="flex flex-column flex-1">
                        <span className="font-bold text-sm">
                            {usuario?.username || 'Usuario'}
                        </span>
                    </div>
                </div>
                <VigenciaUsuario />
            </div>

            {/* ✅ ref aquí — el div con scroll NO se desmonta entre renders */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
                <Menu model={getMenuItems()} className="border-none w-full" />

                {getPedidosItems().length > 0 && (
                    <div className="catalogos-menu">
                        <Button
                            label="Pedidos"
                            icon={`pi pi-${pedidosExpandido ? 'chevron-down' : 'chevron-right'}`}
                            iconPos="right"
                            onClick={() => setPedidosExpandido(!pedidosExpandido)}
                            text
                            className="w-full justify-content-start p-3"
                            size="small"
                        />
                        {pedidosExpandido && (
                            <Menu
                                model={getPedidosItems()}
                                className="border-none w-full"
                            />
                        )}
                    </div>
                )}

                {getCatalogosItems().length > 0 && (
                    <div className="catalogos-menu">
                        <Button
                            label="Catálogos"
                            icon={`pi pi-${catalogosExpandido ? 'chevron-down' : 'chevron-right'}`}
                            onClick={() => setCatalogosExpandido(!catalogosExpandido)}
                            text
                            className="w-full justify-content-start p-3"
                            size="small"
                        />
                        {catalogosExpandido && (
                            <Menu model={getCatalogosItems()} className="border-none w-full" />
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="sidebar-footer p-3">
                <Button
                    label="Cerrar Sesión"
                    icon="pi pi-sign-out"
                    onClick={handleLogout}
                    severity="danger"
                    outlined
                    size="small"
                    className="w-full"
                />
            </div>
        </div>
    );

    return (
        <>
            <button
                className="sidebar-hamburger"
                onClick={() => setMobileOpen(true)}
                aria-label="Abrir menú"
            >
                <i className="pi pi-bars" />
            </button>

            {mobileOpen && (
                <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
            )}

            {/* ✅ Cada instancia tiene su propio ref de scroll */}
            <div className="sidebar-desktop">
                {renderSidebarContent(scrollDesktopRef)}
            </div>

            <div className={`sidebar-mobile ${mobileOpen ? 'sidebar-mobile--open' : ''}`}>
                {renderSidebarContent(scrollMobileRef)}
            </div>
        </>
    );
};

export default Sidebar;