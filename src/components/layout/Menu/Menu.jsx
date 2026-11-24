import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as AntdIcons from '@ant-design/icons';
import {
    ApartmentOutlined,
    AppstoreOutlined,
    AuditOutlined,
    BankOutlined,
    BarsOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    CreditCardOutlined,
    DashboardOutlined,
    DatabaseOutlined,
    DownOutlined,
    EditOutlined,
    ExperimentOutlined,
    FileDoneOutlined,
    FileSearchOutlined,
    FileTextOutlined,
    HeartOutlined,
    KeyOutlined,
    MedicineBoxOutlined,
    ProfileOutlined,
    RadarChartOutlined,
    SafetyOutlined,
    ScheduleOutlined,
    SettingOutlined,
    SolutionOutlined,
    TeamOutlined,
    UserAddOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Alert, Empty, Spin } from 'antd';
import menuStore from '@/store/menuStore';
import './menu.scss';

const menuIconMap = {
    ApartmentOutlined,
    BankOutlined,
    AppstoreOutlined,
    AuditOutlined,
    BarsOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    CreditCardOutlined,
    DashboardOutlined,
    DatabaseOutlined,
    DownOutlined,
    EditOutlined,
    ExperimentOutlined,
    FileDoneOutlined,
    FileSearchOutlined,
    FileTextOutlined,
    HeartOutlined,
    KeyOutlined,
    MedicineBoxOutlined,
    ProfileOutlined,
    RadarChartOutlined,
    SafetyOutlined,
    ScheduleOutlined,
    SettingOutlined,
    SolutionOutlined,
    TeamOutlined,
    UserAddOutlined,
    UserOutlined,
};

const renderMenuIcon = (icon, label = '') => {
    if (React.isValidElement(icon)) return icon;

    if (typeof icon === 'string' && icon.trim() !== '') {
        const cleanName = icon.trim();
        const IconComponent = menuIconMap[cleanName] || AntdIcons[cleanName];
        if (IconComponent) {
            return <IconComponent />;
        }
    }

    const lower = String(label).toLowerCase();
    if (lower.includes('dashboard')) return <DashboardOutlined />;
    if (lower.includes('master')) return <DatabaseOutlined />;
    if (lower.includes('user') || lower.includes('pengguna')) return <UserOutlined />;
    if (lower.includes('dokter') || lower.includes('doctor')) return <SolutionOutlined />;
    if (lower.includes('pasien') || lower.includes('patient')) return <TeamOutlined />;
    if (lower.includes('poli')) return <BankOutlined />;
    if (lower.includes('jadwal') || lower.includes('schedule')) return <ScheduleOutlined />;
    if (lower.includes('obat') || lower.includes('drug') || lower.includes('farmasi')) return <MedicineBoxOutlined />;
    if (lower.includes('lab')) return <ExperimentOutlined />;
    if (lower.includes('tindakan') || lower.includes('procedure')) return <HeartOutlined />;
    if (lower.includes('diagnos') || lower.includes('icd')) return <ProfileOutlined />;
    if (lower.includes('kunjungan') || lower.includes('visit') || lower.includes('antrian') || lower.includes('registrasi')) return <CalendarOutlined />;
    if (lower.includes('periksa') || lower.includes('examination') || lower.includes('medis')) return <FileSearchOutlined />;
    if (lower.includes('kasir') || lower.includes('bill') || lower.includes('bayar') || lower.includes('payment')) return <CreditCardOutlined />;

    return <AppstoreOutlined />;
};

const checkIsActive = (menuItem, pathname) => {
    if (menuItem?.url && menuItem.url !== '#') {
        const normalizedPathname = pathname.replace(/\/$/, '') || '/';
        const normalizedItemUrl = String(menuItem.url).replace(/\/$/, '') || '/';
        if (normalizedPathname === normalizedItemUrl) return true;
    }
    if (Array.isArray(menuItem?.children) && menuItem.children.length > 0) {
        return menuItem.children.some((child) => checkIsActive(child, pathname));
    }
    return false;
};

const MenuItem = ({ item, level = 0, openMenus, toggleMenu, onMenuClick }) => {
    const { pathname } = useLocation();
    const hasChildren = Array.isArray(item.children) && item.children.length > 0;
    const isActive = checkIsActive(item, pathname);
    const isExpanded = Boolean(openMenus[item.key]);

    return (
        <div className={`menu-item-wrapper level-${level}`}>
            {hasChildren ? (
                <div
                    className={`menu-item ${isExpanded ? 'expanded' : ''} ${isActive && !isExpanded ? 'active' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleMenu(item.key);
                    }}
                >
                    <div className="menu-item-content">
                        <span className="menu-icon">{renderMenuIcon(item.icon, item.label)}</span>
                        <span className="menu-label">{item.label}</span>
                    </div>
                    <span className={`menu-arrow ${isExpanded ? 'open' : ''}`}>
                        <DownOutlined />
                    </span>
                </div>
            ) : (
                <Link
                    to={item.url && item.url !== '#' ? item.url : '/dashboard'}
                    className={`menu-item ${isActive ? 'active' : ''}`}
                    onClick={onMenuClick}
                >
                    <div className="menu-item-content">
                        <span className="menu-icon">{renderMenuIcon(item.icon, item.label)}</span>
                        <span className="menu-label">{item.label}</span>
                    </div>
                </Link>
            )}

            {hasChildren && (
                <div
                    className="submenu-container"
                    style={{
                        maxHeight: isExpanded ? '3000px' : '0',
                        opacity: isExpanded ? 1 : 0,
                    }}
                >
                    {item.children.map((child, index) => (
                        <MenuItem
                            key={child.key || index}
                            item={child}
                            level={level + 1}
                            openMenus={openMenus}
                            toggleMenu={toggleMenu}
                            onMenuClick={onMenuClick}
                        />
                    ))}
                </div>
            )}

            {level > 0 && <div className="submenu-line"></div>}
        </div>
    );
};

const MenuList = ({ onMenuClick }) => {
    const [openMenus, setOpenMenus] = useState({});
    const { menuData, loadingMenu, menuError, getMenus } = menuStore();

    useEffect(() => {
        void getMenus();
    }, [getMenus]);

    const toggleMenu = (key) => {
        if (!key) return;
        setOpenMenus((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    return (
        <div className="sidebar-container">
            <div className="menu-overlay"></div>

            {/* Header / Brand Switcher */}
            <div className="sidebar-header">
                <div className="brand-selector">
                    <div className="brand-icon">
                        <ApartmentOutlined style={{ fontSize: '18px' }} />
                    </div>
                    <span className="brand-name">SIMRS Modul</span>
                </div>
            </div>

            {/* Menu Items */}
            <div className="sidebar-menu">
                {loadingMenu ? (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <Spin aria-label="Memuat menu" />
                    </div>
                ) : menuError ? (
                    <Alert
                        type="error"
                        showIcon
                        message="Gagal memuat menu"
                        description={menuError}
                        action={
                            <button
                                type="button"
                                className="btn btn-light"
                                onClick={() => void getMenus(true)}
                            >
                                Coba Lagi
                            </button>
                        }
                    />
                ) : !Array.isArray(menuData) || menuData.length === 0 ? (
                    <Empty
                        description={<span style={{ color: 'rgba(255,255,255,0.65)' }}>Tidak ada menu yang tersedia</span>}
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                ) : (
                    menuData.map((item) => (
                        <MenuItem
                            key={item.key}
                            item={item}
                            openMenus={openMenus}
                            toggleMenu={toggleMenu}
                            onMenuClick={onMenuClick}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default React.memo(MenuList);
