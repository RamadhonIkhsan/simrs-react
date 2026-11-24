import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

const dateFormat = 'DD/MM/YYYY';
const monthFormat = 'MM/YYYY';

function limitString(text, limit) {
    const str = String(text ?? '');
    return str.length > limit ? str.substring(0, limit) + '...' : str;
}

function setFormatInputDate(picker, format) {
    if (picker === 'month') return !format ? monthFormat : format;
    if (picker === 'year') return 'YYYY';
    return format ? format : dateFormat;
}

function today() {
    const date = new Date();
    const year = date.getFullYear();
    return (
        year +
        '-' +
        ('0' + (date.getMonth() + 1)).slice(-2) +
        '-' +
        ('0' + date.getDate()).slice(-2)
    );
}

function differenceDate(start, end) {
    const tanggalAwal = new Date(start);
    const tanggalAkhir = new Date(end);
    const selisihWaktu = tanggalAkhir - tanggalAwal;
    return selisihWaktu / (1000 * 60 * 60 * 24);
}

function formatDuration(seconds) {
    const dur = dayjs.duration(seconds, 'seconds');
    const h = Math.floor(dur.asHours());
    const m = dur.minutes();

    return [h ? `${h} Jam` : '', m ? `${m} Menit` : ''].filter(Boolean).join(' ');
}

function formatDate(dates, type) {
    const date = new Date(dates);

    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    const monthNames = [
        'Januari',
        'Februari',
        'Maret',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Agustus',
        'September',
        'Oktober',
        'November',
        'Desember',
    ];

    const monthNamesSmall = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'Mei',
        'Jun',
        'Jul',
        'Ags',
        'Sep',
        'Okt',
        'Nov',
        'Des',
    ];

    const padZero = (v) => (v < 10 ? '0' + v : v);

    const day = padZero(date.getDate());
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
    const hour = padZero(date.getHours());
    const minute = padZero(date.getMinutes());
    const sec = padZero(date.getSeconds());

    switch (type) {
        case 'd':
            return day;
        case 'm':
            return monthIndex + 1;
        case 'mm':
            return monthNamesSmall[monthIndex];
        case 'M':
            return monthNames[monthIndex];
        case 'Y':
            return year;
        case 'd-mm':
            return day + ' ' + monthNamesSmall[monthIndex];
        case 'd-mm-Y':
            return day + ' ' + monthNamesSmall[monthIndex] + ' ' + year;
        case 'd-m-Y':
            return day + '-' + padZero(monthIndex + 1) + '-' + year;
        case 'Y-m-d':
            return year + '-' + padZero(monthIndex + 1) + '-' + day;
        case 'd-M-Y':
            return day + ' ' + monthNames[monthIndex] + ' ' + year;
        case 'd-m-Y H:i:s':
            return (
                day +
                '-' +
                padZero(monthIndex + 1) +
                '-' +
                year +
                ', ' +
                hour +
                ':' +
                minute +
                ':' +
                sec
            );
        case 'd-M-Y H:i:s':
            return (
                day +
                ' ' +
                monthNames[monthIndex] +
                ' ' +
                year +
                ', ' +
                hour +
                ':' +
                minute +
                ':' +
                sec
            );
        case 'day-d-M-Y':
            return (
                dayNames[date.getDay()] +
                ', ' +
                day +
                ' ' +
                monthNames[monthIndex] +
                ' ' +
                year
            );
        case 'd-M-Y H:i':
            return (
                day +
                ' ' +
                monthNames[monthIndex] +
                ' ' +
                year +
                ', ' +
                hour +
                ':' +
                minute
            );
        case 'dMYHis':
            return day + padZero(monthIndex + 1) + year + hour + minute + sec;
        case 'H:i':
            return hour + ':' + minute;
        default:
            return '';
    }
}

function formatTime(time, type) {
    const [hour, minute, sec] = String(time || '').split(':');

    switch (type) {
        case 'H:i':
            return hour + ':' + minute;
        case 'H:i:s':
            return hour + ':' + minute + ':' + sec;
        case 'minute': {
            const jam = Number(hour) * 60;
            return jam + Number(minute);
        }
        default:
            return '';
    }
}

function numFormatClear(data) {
    if (data === null || data === undefined) return '0';
    return String(data).replace(/\./g, '');
}

function numFormat(value) {
    const num = Number(value ?? 0);
    if (Number.isNaN(num)) return '0';
    const val = (num / 1).toFixed(0).replace('.', ',');
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function randomId() {
    const cryptoObj = window.crypto || window.msCrypto;
    const array = new Uint32Array(1);
    return cryptoObj.getRandomValues(array);
}

function filterObjectByKeys(obj, keysToKeep) {
    const filteredObject = {};
    for (const key in obj) {
        if (!keysToKeep.includes(key)) {
            filteredObject[key] = obj[key];
        }
    }
    return filteredObject;
}

function UcFirstWord(str) {
    if (!str) return '';
    const pieces = String(str).split(' ');
    for (let i = 0; i < pieces.length; i++) {
        const j = pieces[i].charAt(0).toUpperCase();
        pieces[i] = j + pieces[i].substr(1);
    }
    return pieces.join(' ');
}

export const Helper = {
    limitString,
    today,
    formatDate,
    formatDuration,
    formatTime,
    numFormatClear,
    numFormat,
    filterObjectByKeys,
    differenceDate,
    randomId,
    dateFormat,
    monthFormat,
    setFormatInputDate,
    UcFirstWord,
};

export const ROLE = {
    ADMIN: 1,
    REGISTRATION: 2,
    DOCTOR: 3,
    PHARMACY: 4,
    LAB: 5,
    CASHIER: 6,
};
