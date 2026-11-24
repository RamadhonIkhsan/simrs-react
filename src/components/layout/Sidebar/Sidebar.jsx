import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    BellOutlined,
    ControlOutlined,
    DoubleLeftOutlined,
    DoubleRightOutlined,
    KeyOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Badge, Empty, FloatButton } from 'antd';
import useAuth from '@/hooks/useAuth';
import menuStore from '@/store/menuStore';
import userStore from '@/store/userStore';
import MenuList from '../Menu/Menu';
import FullScreenToggle from './FullScreenToggle';
import ModalPassword from './ModalPassword';
import ModalProfile from './ModalProfile';
import ThemeToggle from './ThemeToggle';
import './sidebar.scss';

const Sidebar = () => {
    const navigate = useNavigate();
    const { removeAuth } = useAuth();
    const { dataUser, clearUser } = userStore();
    const { setToggle, toggleStatus, setToggleStatus, resetMenu } = menuStore();

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const modalPasswordRef = useRef(null);
    const modalProfileRef = useRef(null);
    const dropdownRef = useRef(null);
    const notifDropdownRef = useRef(null);

    const toggleDropdown = () => {
        setIsDropdownOpen((prev) => !prev);
        if (!isDropdownOpen) {
            setIsNotifOpen(false);
        }
    };

    const toggleNotifDropdown = () => {
        setIsNotifOpen((prev) => !prev);
        if (!isNotifOpen) {
            setIsDropdownOpen(false);
        }
    };

    const toggleMobile = () => {
        setIsMobileOpen((prev) => !prev);
    };

    const actLogout = async () => {
        await removeAuth();
        clearUser();
        resetMenu();
        navigate('/login', { replace: true });
    };

    const isExpanded = toggleStatus;

    useEffect(() => {
        if (isExpanded) {
            document.body.classList.add('sidebar-expanded');
            document.body.classList.remove('sidebar-collapsed');
        } else {
            document.body.classList.add('sidebar-collapsed');
            document.body.classList.remove('sidebar-expanded');
        }
    }, [isExpanded]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('toggleStatus');
            if (saved !== null) {
                setToggleStatus(saved === 'true');
            }
        }

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target)) {
                setIsNotifOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setToggleStatus]);

    const roleName =
        dataUser?.role_name ||
        dataUser?.role?.nm ||
        (dataUser?.role_id ? `Role #${dataUser.role_id}` : 'Pengguna');
    const displayName =
        dataUser?.full_name || dataUser?.fullname || dataUser?.name || dataUser?.username || 'User';

    return (
        <>
            <div className={`sidebar-mobile-header ${isMobileOpen ? 'active' : ''}`}>
                <div className="hamburger" onClick={toggleMobile}>
                    <span className="bar"></span>
                    <span className="bar"></span>
                    <span className="bar"></span>
                </div>
                <div className="mobile-logo">
                    <img src="/img/logo-harkel.png" alt="logo" />
                </div>
            </div>

            {isMobileOpen && <div className="sidebar-overlay" onClick={toggleMobile}></div>}

            <aside
                className={`sidebar-main ${isExpanded ? 'expanded' : 'collapsed'} ${
                    isMobileOpen ? 'mobile-open' : ''
                }`}
            >
                <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                    <div className="sidebar-top">
                        <div className="sidebar-menu-btn">
                            <img src="/img/logo-harkel.png" alt="logo" />
                        </div>
                        <div className="sidebar-brand">
                            <div className="sidebar-brand-text">
                                <div className="sidebar-title">
                                    SIMRS <small>v1.0</small>
                                </div>
                                <div className="sidebar-subtitle">
                                    Sistem Informasi Manajemen RS
                                </div>
                            </div>
                        </div>
                    </div>
                </Link>

                <div className="sidebar-middle">
                    <MenuList onMenuClick={() => setIsMobileOpen(false)} />
                </div>

                <div className="sidebar-bottom">
                    {/* Notification Button */}
                    <div className="sidebar-user-container" ref={notifDropdownRef}>
                        <div
                            className={`sidebar-user ${isNotifOpen ? 'active' : ''}`}
                            onClick={toggleNotifDropdown}
                        >
                            <Badge count={0} size="small" offset={[-2, 2]}>
                                <div className="sidebar-avatar">
                                    <BellOutlined style={{ color: 'white' }} />
                                </div>
                            </Badge>
                            <div className="sidebar-greeting">Notifikasi</div>
                        </div>

                        {isNotifOpen && (
                            <div
                                className={`sidebar-dropdown ${
                                    isExpanded ? 'expanded-mode' : 'collapsed-mode'
                                }`}
                            >
                                <div className="dropdown-header">
                                    <div className="dropdown-user-info">
                                        <div className="user-name">Notifikasi Terbaru</div>
                                    </div>
                                </div>
                                <div className="dropdown-divider"></div>
                                <div className="dropdown-menu notif-dropdown" style={{ padding: '12px' }}>
                                    <Empty
                                        description="Tidak ada notifikasi"
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Profile Dropdown */}
                    <div className="sidebar-user-container" ref={dropdownRef}>
                        <div
                            className={`sidebar-user ${isDropdownOpen ? 'active' : ''}`}
                            onClick={toggleDropdown}
                        >
                            <div className="sidebar-avatar">
                                <UserOutlined />
                            </div>
                            <div className="sidebar-greeting">
                                <div
                                    style={{
                                        color: 'var(--warning)',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                    }}
                                >
                                    {roleName}
                                </div>
                                <div className="greeting-text">
                                    Hi, {dataUser?.username || 'User'}
                                </div>
                            </div>
                        </div>

                        {isDropdownOpen && (
                            <div
                                className={`sidebar-dropdown ${
                                    isExpanded ? 'expanded-mode' : 'collapsed-mode'
                                }`}
                            >
                                <div className="dropdown-header">
                                    <div className="dropdown-user-info">
                                        <div className="user-name">{displayName}</div>
                                        <div className="user-email">
                                            {dataUser?.email || roleName}
                                        </div>
                                    </div>
                                </div>
                                <div className="dropdown-divider"></div>
                                <div className="dropdown-menu">
                                    <a
                                        href="#profile"
                                        className="dropdown-item"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setIsDropdownOpen(false);
                                            setIsMobileOpen(false);
                                            modalProfileRef.current?.actOpenModal();
                                        }}
                                    >
                                        <div className="item-icon">
                                            <UserOutlined />
                                        </div>
                                        <span className="item-text">Profil Saya</span>
                                    </a>
                                    <a
                                        href="#password"
                                        className="dropdown-item"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setIsDropdownOpen(false);
                                            setIsMobileOpen(false);
                                            modalPasswordRef.current?.actOpenModal();
                                        }}
                                    >
                                        <div className="item-icon">
                                            <KeyOutlined />
                                        </div>
                                        <span className="item-text">Keamanan Akun</span>
                                    </a>
                                </div>
                                <div className="dropdown-divider"></div>
                                <div className="dropdown-footer">
                                    <button
                                        type="button"
                                        onClick={actLogout}
                                        className="btn btn-primary"
                                        style={{ width: '100%' }}
                                    >
                                        Log out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            <FloatButton.Group
                trigger="click"
                className="my-float-button"
                placement="right"
                icon={<ControlOutlined />}
            >
                <ThemeToggle />
                <FullScreenToggle />
                <button type="button" onClick={setToggle} className="btn-expand">
                    {isExpanded ? <DoubleLeftOutlined /> : <DoubleRightOutlined />}
                </button>
            </FloatButton.Group>

            <ModalPassword ref={modalPasswordRef} />
            <ModalProfile ref={modalProfileRef} />
        </>
    );
};

export default React.memo(Sidebar);
