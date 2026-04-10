function login() {
    if (document.getElementById('password').value === "surveyb") {
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('main-page').style.display = 'block';
    } else { alert("รหัสผ่านไม่ถูกต้อง"); }
}

// ฟังก์ชันแปลงหน่วย: ปัดเศษฟิลิปดาเป็นทศนิยม 2 ตำแหน่ง
function toDMS(decimalDegree) {
    if (isNaN(decimalDegree) || Math.abs(decimalDegree) < 1e-9) return "0° 0' 0.00\"";
    
    let absDeg = Math.abs(decimalDegree);
    let d = Math.floor(absDeg);
    let m_float = (absDeg - d) * 60;
    let m = Math.floor(m_float);
    let s = (m_float - m) * 60;

    // ปัดเศษวินาทีให้เหลือ 2 ตำแหน่ง
    let s_fixed = parseFloat(s.toFixed(2));

    if (s_fixed >= 60) {
        s_fixed = 0;
        m++;
    }
    if (m >= 60) {
        m = 0;
        d++;
    }

    return `${d}° ${m}' ${s_fixed.toFixed(2)}"`;
}

function calculateCurve() {
    const D = parseFloat(document.getElementById('input-D').value);
    const a = parseFloat(document.getElementById('input-a').value);
    const PI = (parseFloat(document.getElementById('pi-km').value) * 1000) + parseFloat(document.getElementById('pi-m').value);
    
    const delta = parseFloat(document.getElementById('deg').value || 0) + 
                  (parseFloat(document.getElementById('min').value || 0) / 60) + 
                  (parseFloat(document.getElementById('sec').value || 0) / 3600);
    const deltaHalf = delta / 2;
    const deltaRadHalf = deltaHalf * Math.PI / 180;

    // คำนวณค่าตัวแปร (ปัด 3 ตำแหน่งสำหรับการแสดงผล)
    const R = 5729.5779 / D;
    const T = R * Math.tan(deltaRadHalf);
    const L = 100 * (delta / D);
    const PC = PI - T;
    const PT = PC + L;
    const MID = PC + (L / 2);

    const E = R * (1 / Math.cos(deltaRadHalf) - 1);
    const M = R * (1 - Math.cos(deltaRadHalf));
    const LC = 2 * R * Math.sin(deltaRadHalf);

    // Subarc (ปัด 3 ตำแหน่ง)
    let firstFull = Math.ceil(PC / a) * a;
    let a1 = firstFull - PC;
    let lastFull = Math.floor(PT / a) * a;
    let a2 = PT - lastFull || a;
    let staBeforeMid = Math.floor(MID / a) * a;
    let a3 = MID - staBeforeMid;

    // แสดงรายการคำนวณละเอียด
    document.getElementById('calc-summary-content').innerHTML = `
        <div>
            <p><b>R (Radius):</b> ${R.toFixed(3)} ม.</p>
            <p><b>T (Tangent):</b> ${T.toFixed(3)} ม.</p>
            <p><b>L (Curve Length):</b> ${L.toFixed(3)} ม.</p>
            <p><b>LC (Long Chord):</b> ${LC.toFixed(3)} ม.</p>
            <p><b>E:</b> ${E.toFixed(3)} | <b>M:</b> ${M.toFixed(3)}</p>
        </div>
        <div>
            <p><b>a1:</b> ${a1.toFixed(3)} | <b>d1/2:</b> ${toDMS((0.3*a1*D)/60)}</p>
            <p><b>a2:</b> ${a2.toFixed(3)} | <b>d2/2:</b> ${toDMS((0.3*a2*D)/60)}</p>
            <p><b>a3:</b> ${a3.toFixed(3)} | <b>d3/2:</b> ${toDMS((0.3*a3*D)/60)}</p>
            <p><b>Sta PC:</b> ${formatSta(PC)}</p>
            <p><b>Sta PT:</b> ${formatSta(PT)}</p>
        </div>
    `;

    renderTable(PC, PT, MID, a, D, R);
    document.getElementById('results-area').style.display = 'block';
}

function formatSta(m) {
    let km = Math.floor(m / 1000);
    let meters = (m % 1000).toFixed(3);
    return `${km}+${meters.padStart(7, '0')}`;
}

function renderTable(PC, PT, MID, a, D, R) {
    let stations = [{ sta: PC, type: 'PC' }];
    let firstFull = Math.ceil(PC / a) * a;
    let addedMid = false;

    for (let s = firstFull; s < PT; s += a) {
        if (!addedMid && s > MID) { stations.push({ sta: MID, type: 'MID' }); addedMid = true; }
        stations.push({ sta: s, type: 'NORM' });
    }
    if (!addedMid) stations.push({ sta: MID, type: 'MID' });
    stations.push({ sta: PT, type: 'PT' });

    const tbody = document.querySelector('#table-deflection tbody');
    tbody.innerHTML = "";
    let sumD2 = 0;
    let lastRef = PC;

    stations.forEach((item, i) => {
        let diff_a = (item.type === 'PC') ? 0 : (item.type === 'MID' ? item.sta - stations[i-1].sta : item.sta - lastRef);
        let d_val = (0.3 * diff_a * D) / 60;
        
        if (item.type !== 'PC' && item.type !== 'MID') sumD2 += d_val;
        let rowSum = (item.type === 'MID') ? (sumD2 + d_val) : sumD2;
        if (item.type !== 'MID') lastRef = item.sta;

        let ci = 2 * R * Math.sin(d_val * Math.PI / 180);
        
        tbody.innerHTML += `<tr class="${item.type !== 'NORM' ? 'row-special' : ''}">
            <td>${formatSta(item.sta)} (${item.type})</td>
            <td>${diff_a.toFixed(3)}</td>
            <td>${toDMS(d_val)}</td>
            <td>${toDMS(rowSum)}</td>
            <td>${ci.toFixed(3)}</td>
        </tr>`;
    });
}