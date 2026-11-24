import { SearchOutlined } from '@ant-design/icons';

export default function SearchInput({ handleSearch, style }) {
    const handleChange = (e) => {
        const value = e.target.value.replace(/[^a-zA-Z0-9 ]/g, '');
        e.target.value = value;
        handleSearch(e);
    };

    return (
        <div style={{ position: 'relative' }}>
            <input
                type="text"
                data-kt-filter="search"
                className="form-control searchInput"
                style={style}
                onChange={handleChange}
                id="tableSearch"
                placeholder="Cari..."
            />
            <SearchOutlined className="icon-search text-primary" />
        </div>
    );
}
