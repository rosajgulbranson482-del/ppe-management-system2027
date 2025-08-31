// تكوين Firebase الجديد
const firebaseConfig = {
  apiKey: "AIzaSyCnvyDGvukqbM9rMvwnFHk2983IEWc_yfs",
  authDomain: "ppe-system-v2-2026.firebaseapp.com",
  projectId: "ppe-system-v2-2026",
  storageBucket: "ppe-system-v2-2026.firebasestorage.app",
  messagingSenderId: "296968854279",
  appId: "1:296968854279:web:e5d8d1e38d49146ff22ca2",
  measurementId: "G-390KMKGBSX"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// بيانات النظام
let employees = [];
let inventory = [];
let assignments = [];
let currentUser = null;

// المستخدمون الافتراضيون
const defaultUsers = [
    {
        id: 'admin',
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        name: 'المدير العام'
    },
    {
        id: 'user',
        username: 'user',
        password: 'user123',
        role: 'user',
        name: 'مستخدم عادي'
    }
];

// وظائف Firebase مع معالجة الأخطاء المحسنة
async function saveToFirestore(collectionName, data) {
    try {
        const docRef = await db.collection(collectionName).add(data);
        console.log(`تم حفظ البيانات في ${collectionName} بنجاح`);
        return docRef.id;
    } catch (error) {
        console.error(`خطأ في حفظ البيانات في ${collectionName}:`, error);
        // نظام احتياطي: حفظ في localStorage
        const localData = JSON.parse(localStorage.getItem(collectionName) || '[]');
        data.id = Date.now().toString();
        localData.push(data);
        localStorage.setItem(collectionName, JSON.stringify(localData));
        return data.id;
    }
}

async function loadFromFirestore(collectionName) {
    try {
        const querySnapshot = await db.collection(collectionName).orderBy('timestamp', 'desc').get();
        const data = [];
        querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });
        console.log(`تم تحميل البيانات من ${collectionName} بنجاح`);
        return data;
    } catch (error) {
        console.error(`خطأ في تحميل البيانات من ${collectionName}:`, error);
        // نظام احتياطي: تحميل من localStorage
        return JSON.parse(localStorage.getItem(collectionName) || '[]');
    }
}

async function updateInFirestore(collectionName, docId, data) {
    try {
        await db.collection(collectionName).doc(docId).update(data);
        console.log(`تم تحديث البيانات في ${collectionName} بنجاح`);
        return true;
    } catch (error) {
        console.error(`خطأ في تحديث البيانات في ${collectionName}:`, error);
        // نظام احتياطي: تحديث في localStorage
        const localData = JSON.parse(localStorage.getItem(collectionName) || '[]');
        const index = localData.findIndex(item => item.id === docId);
        if (index !== -1) {
            localData[index] = { ...localData[index], ...data };
            localStorage.setItem(collectionName, JSON.stringify(localData));
        }
        return false;
    }
}

async function deleteFromFirestore(collectionName, docId) {
    try {
        await db.collection(collectionName).doc(docId).delete();
        console.log(`تم حذف البيانات من ${collectionName} بنجاح`);
        return true;
    } catch (error) {
        console.error(`خطأ في حذف البيانات من ${collectionName}:`, error);
        // نظام احتياطي: حذف من localStorage
        const localData = JSON.parse(localStorage.getItem(collectionName) || '[]');
        const filteredData = localData.filter(item => item.id !== docId);
        localStorage.setItem(collectionName, JSON.stringify(filteredData));
        return false;
    }
}

async function clearAllFirestoreData() {
    try {
        const collections = ['employees', 'inventory', 'assignments'];
        for (const collectionName of collections) {
            const querySnapshot = await db.collection(collectionName).get();
            const batch = db.batch();
            querySnapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        }
        console.log('تم مسح جميع البيانات من Firebase بنجاح');
        return true;
    } catch (error) {
        console.error('خطأ في مسح البيانات من Firebase:', error);
        // نظام احتياطي: مسح localStorage
        localStorage.clear();
        return false;
    }
}

// وظائف تسجيل الدخول
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        alert('يرجى إدخال اسم المستخدم وكلمة المرور');
        return;
    }
    
    const user = defaultUsers.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        updateUserInterface();
        loadAllData();
        showNotification('تم تسجيل الدخول بنجاح', 'success');
    } else {
        alert('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';
    showNotification('تم تسجيل الخروج بنgاح', 'info');
}

function updateUserInterface() {
    if (!currentUser) return;
    
    document.getElementById('currentUserName').textContent = currentUser.name;
    document.getElementById('currentUserRole').textContent = getRoleText(currentUser.role);
    
    // إخفاء/إظهار العناصر حسب الصلاحيات
    const adminElements = document.querySelectorAll('.admin-only');
    const userElements = document.querySelectorAll('.user-only');
    
    adminElements.forEach(element => {
        element.style.display = currentUser.role === 'admin' ? 'block' : 'none';
    });
    
    userElements.forEach(element => {
        element.style.display = currentUser.role !== 'viewer' ? 'block' : 'none';
    });
}

function getRoleText(role) {
    const roles = {
        'admin': 'مدير',
        'user': 'مستخدم عادي',
        'viewer': 'مشاهد فقط'
    };
    return roles[role] || 'غير محدد';
}

// تحميل البيانات عند بدء التطبيق
async function loadAllData() {
    try {
        employees = await loadFromFirestore('employees');
        inventory = await loadFromFirestore('inventory');
        assignments = await loadFromFirestore('assignments');
        
        updateEmployeeTable();
        updateInventoryTable();
        updateAssignmentTable();
        updateDashboard();
        updateUserStats();
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        showNotification('خطأ في تحميل البيانات', 'error');
    }
}

// وظائف إدارة الموظفين
async function addEmployee() {
    if (currentUser.role === 'viewer') {
        showNotification('ليس لديك صلاحية لإضافة الموظفين', 'error');
        return;
    }
    
    const name = document.getElementById('employeeName').value;
    const company = document.getElementById('employeeCompany').value;
    const position = document.getElementById('employeePosition').value;
    const phone = document.getElementById('employeePhone').value;
    const shift = document.getElementById('employeeShift').value;
    
    if (!name || !company || !position || !phone || !shift) {
        alert('يرجى ملء جميع الحقول');
        return;
    }
    
    const employee = {
        name,
        company,
        position,
        phone,
        shift,
        status: 'نشط',
        timestamp: new Date()
    };
    
    try {
        const docId = await saveToFirestore('employees', employee);
        employee.id = docId;
        employees.push(employee);
        updateEmployeeTable();
        updateDashboard();
        clearEmployeeForm();
        showNotification('تم إضافة الموظف بنجاح', 'success');
    } catch (error) {
        console.error('خطأ في إضافة الموظف:', error);
        showNotification('خطأ في إضافة الموظف', 'error');
    }
}

function clearEmployeeForm() {
    document.getElementById('employeeName').value = '';
    document.getElementById('employeeCompany').value = '';
    document.getElementById('employeePosition').value = '';
    document.getElementById('employeePhone').value = '';
    document.getElementById('employeeShift').value = '';
}

function updateEmployeeTable() {
    const tbody = document.getElementById('employeeTableBody');
    tbody.innerHTML = '';
    
    if (employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">لا توجد بيانات</td></tr>';
        return;
    }
    
    employees.forEach(employee => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${employee.name}</td>
            <td>${employee.company}</td>
            <td>${employee.position}</td>
            <td><span class="badge ${employee.status === 'نشط' ? 'bg-success' : 'bg-danger'}">${employee.status}</span></td>
            <td>
                ${currentUser.role !== 'viewer' ? `
                    <button class="btn btn-sm btn-warning me-1" onclick="editEmployee('${employee.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${employee.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function deleteEmployee(id) {
    if (currentUser.role === 'viewer') {
        showNotification('ليس لديك صلاحية لحذف الموظفين', 'error');
        return;
    }
    
    if (confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
        try {
            await deleteFromFirestore('employees', id);
            employees = employees.filter(emp => emp.id !== id);
            updateEmployeeTable();
            updateDashboard();
            showNotification('تم حذف الموظف بنجاح', 'success');
        } catch (error) {
            console.error('خطأ في حذف الموظف:', error);
            showNotification('خطأ في حذف الموظف', 'error');
        }
    }
}

// وظائف إدارة المخزون
async function addInventoryItem() {
    if (currentUser.role === 'viewer') {
        showNotification('ليس لديك صلاحية لإضافة المعدات', 'error');
        return;
    }
    
    const name = document.getElementById('itemName').value;
    const type = document.getElementById('itemType').value;
    const size = document.getElementById('itemSize').value;
    const quantity = parseInt(document.getElementById('itemQuantity').value);
    
    if (!name || !type || !size || !quantity) {
        alert('يرجى ملء جميع الحقول');
        return;
    }
    
    const item = {
        name,
        type,
        size,
        quantity,
        status: quantity > 0 ? 'متوفر' : 'غير متوفر',
        timestamp: new Date()
    };
    
    try {
        const docId = await saveToFirestore('inventory', item);
        item.id = docId;
        inventory.push(item);
        updateInventoryTable();
        updateDashboard();
        clearInventoryForm();
        showNotification('تم إضافة المعدة بنجاح', 'success');
    } catch (error) {
        console.error('خطأ في إضافة المعدة:', error);
        showNotification('خطأ في إضافة المعدة', 'error');
    }
}

function clearInventoryForm() {
    document.getElementById('itemName').value = '';
    document.getElementById('itemType').value = '';
    document.getElementById('itemSize').value = '';
    document.getElementById('itemQuantity').value = '';
}

function updateInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    tbody.innerHTML = '';
    
    if (inventory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">لا توجد بيانات</td></tr>';
        return;
    }
    
    inventory.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.type}</td>
            <td>${item.size}</td>
            <td>${item.quantity}</td>
            <td><span class="badge ${item.status === 'متوفر' ? 'bg-success' : 'bg-danger'}">${item.status}</span></td>
            <td>
                ${currentUser.role !== 'viewer' ? `
                    <button class="btn btn-sm btn-warning me-1" onclick="editInventoryItem('${item.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteInventoryItem('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function deleteInventoryItem(id) {
    if (currentUser.role === 'viewer') {
        showNotification('ليس لديك صلاحية لحذف المعدات', 'error');
        return;
    }
    
    if (confirm('هل أنت متأكد من حذف هذه المعدة؟')) {
        try {
            await deleteFromFirestore('inventory', id);
            inventory = inventory.filter(item => item.id !== id);
            updateInventoryTable();
            updateDashboard();
            showNotification('تم حذف المعدة بنجاح', 'success');
        } catch (error) {
            console.error('خطأ في حذف المعدة:', error);
            showNotification('خطأ في حذف المعدة', 'error');
        }
    }
}

// وظائف تسليم المعدات
async function addAssignment() {
    if (currentUser.role === 'viewer') {
        showNotification('ليس لديك صلاحية لتسليم المعدات', 'error');
        return;
    }
    
    const employeeId = document.getElementById('assignEmployee').value;
    const itemId = document.getElementById('assignItem').value;
    const size = document.getElementById('assignSize').value;
    const quantity = parseInt(document.getElementById('assignQuantity').value);
    const reason = document.getElementById('assignReason').value;
    
    if (!employeeId || !itemId || !size || !quantity || !reason) {
        alert('يرجى ملء جميع الحقول');
        return;
    }
    
    const employee = employees.find(emp => emp.id === employeeId);
    const item = inventory.find(inv => inv.id === itemId);
    
    if (!employee || !item) {
        alert('بيانات غير صحيحة');
        return;
    }
    
    if (item.quantity < quantity) {
        alert('الكمية المطلوبة غير متوفرة في المخزون');
        return;
    }
    
    const assignment = {
        employeeId,
        employeeName: employee.name,
        itemId,
        itemName: item.name,
        size,
        quantity,
        reason,
        date: new Date().toLocaleDateString('ar-SA'),
        timestamp: new Date()
    };
    
    try {
        const docId = await saveToFirestore('assignments', assignment);
        assignment.id = docId;
        assignments.push(assignment);
        
        // تحديث المخزون
        item.quantity -= quantity;
        item.status = item.quantity > 0 ? 'متوفر' : 'غير متوفر';
        await updateInFirestore('inventory', item.id, { quantity: item.quantity, status: item.status });
        
        updateAssignmentTable();
        updateInventoryTable();
        updateDashboard();
        clearAssignmentForm();
        showNotification('تم تسليم المعدة بنجاح', 'success');
    } catch (error) {
        console.error('خطأ في تسليم المعدة:', error);
        showNotification('خطأ في تسليم المعدة', 'error');
    }
}

function clearAssignmentForm() {
    document.getElementById('assignEmployee').value = '';
    document.getElementById('assignItem').value = '';
    document.getElementById('assignSize').value = '';
    document.getElementById('assignQuantity').value = '';
    document.getElementById('assignReason').value = '';
}

function updateAssignmentTable() {
    const tbody = document.getElementById('assignmentTableBody');
    tbody.innerHTML = '';
    
    if (assignments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">لا توجد عمليات تسليم مسجلة</td></tr>';
        return;
    }
    
    assignments.forEach(assignment => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${assignment.date}</td>
            <td>${assignment.employeeName}</td>
            <td>${assignment.itemName}</td>
            <td>${assignment.size}</td>
            <td>${assignment.quantity}</td>
            <td>${assignment.reason}</td>
        `;
        tbody.appendChild(row);
    });
}

// وظائف لوحة التحكم
function updateDashboard() {
    // تحديث آخر عمليات التسليم
    const recentAssignments = assignments.slice(-5).reverse();
    const recentTableBody = document.getElementById('recentAssignmentsBody');
    recentTableBody.innerHTML = '';
    
    if (recentAssignments.length === 0) {
        recentTableBody.innerHTML = '<tr><td colspan="4" class="text-center">لا توجد عمليات تسليم مسجلة</td></tr>';
    } else {
        recentAssignments.forEach(assignment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${assignment.date}</td>
                <td>${assignment.employeeName}</td>
                <td>${assignment.itemName}</td>
                <td>${assignment.quantity}</td>
            `;
            recentTableBody.appendChild(row);
        });
    }
    
    // تحديث الرسوم البيانية
    updateCharts();
}

function updateCharts() {
    // رسم بياني لحالة الموظفين
    const activeEmployees = employees.filter(emp => emp.status === 'نشط').length;
    const inactiveEmployees = employees.filter(emp => emp.status === 'غير نشط').length;
    
    const employeeChart = document.getElementById('employeeChart');
    if (employeeChart) {
        const ctx = employeeChart.getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['نشط', 'غير نشط'],
                datasets: [{
                    data: [activeEmployees, inactiveEmployees],
                    backgroundColor: ['#28a745', '#dc3545']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // رسم بياني لحالة المخزون
    const availableItems = inventory.filter(item => item.status === 'متوفر').length;
    const unavailableItems = inventory.filter(item => item.status === 'غير متوفر').length;
    
    const inventoryChart = document.getElementById('inventoryChart');
    if (inventoryChart) {
        const ctx = inventoryChart.getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['متوفر', 'غير متوفر'],
                datasets: [{
                    data: [availableItems, unavailableItems],
                    backgroundColor: ['#007bff', '#ffc107']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// وظائف التقارير
function generateInventoryReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // إعداد الخط العربي
    doc.setFont('helvetica');
    doc.setFontSize(16);
    doc.text('تقرير المخزون', 105, 20, { align: 'center' });
    
    // إعداد الجدول
    const tableData = inventory.map(item => [
        item.name,
        item.type,
        item.size,
        item.quantity.toString(),
        item.status
    ]);
    
    doc.autoTable({
        head: [['اسم المعدة', 'النوع', 'المقاس', 'الكمية', 'الحالة']],
        body: tableData,
        startY: 30,
        styles: { fontSize: 10 }
    });
    
    doc.save('تقرير_المخزون.pdf');
    showNotification('تم تصدير تقرير المخزون بنجاح', 'success');
}

function generateAssignmentReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // إعداد الخط العربي
    doc.setFont('helvetica');
    doc.setFontSize(16);
    doc.text('تقرير التسليمات', 105, 20, { align: 'center' });
    
    // إعداد الجدول
    const tableData = assignments.map(assignment => [
        assignment.date,
        assignment.employeeName,
        assignment.itemName,
        assignment.size,
        assignment.quantity.toString(),
        assignment.reason
    ]);
    
    doc.autoTable({
        head: [['التاريخ', 'الموظف', 'المعدة', 'المقاس', 'الكمية', 'السبب']],
        body: tableData,
        startY: 30,
        styles: { fontSize: 8 }
    });
    
    doc.save('تقرير_التسليمات.pdf');
    showNotification('تم تصدير تقرير التسليمات بنجاح', 'success');
}

// وظائف الاستيراد والتصدير
function exportToExcel() {
    const wb = XLSX.utils.book_new();
    
    // ورقة الموظفين
    const employeeData = employees.map(emp => ({
        'الاسم': emp.name,
        'الشركة': emp.company,
        'المسمى الوظيفي': emp.position,
        'رقم الهاتف': emp.phone,
        'الوردية': emp.shift,
        'الحالة': emp.status
    }));
    const employeeWS = XLSX.utils.json_to_sheet(employeeData);
    XLSX.utils.book_append_sheet(wb, employeeWS, 'الموظفين');
    
    // ورقة المخزون
    const inventoryData = inventory.map(item => ({
        'اسم المعدة': item.name,
        'النوع': item.type,
        'المقاس': item.size,
        'الكمية': item.quantity,
        'الحالة': item.status
    }));
    const inventoryWS = XLSX.utils.json_to_sheet(inventoryData);
    XLSX.utils.book_append_sheet(wb, inventoryWS, 'المخزون');
    
    // ورقة التسليمات
    const assignmentData = assignments.map(assignment => ({
        'التاريخ': assignment.date,
        'الموظف': assignment.employeeName,
        'المعدة': assignment.itemName,
        'المقاس': assignment.size,
        'الكمية': assignment.quantity,
        'السبب': assignment.reason
    }));
    const assignmentWS = XLSX.utils.json_to_sheet(assignmentData);
    XLSX.utils.book_append_sheet(wb, assignmentWS, 'التسليمات');
    
    XLSX.writeFile(wb, 'بيانات_نظام_PPE.xlsx');
    showNotification('تم تصدير البيانات بنجاح', 'success');
}

async function handleFileImport(event) {
    if (currentUser.role === 'viewer') {
        showNotification('ليس لديك صلاحية لاستيراد البيانات', 'error');
        return;
    }
    
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // استيراد بيانات الموظفين
            if (workbook.SheetNames.includes('الموظفين')) {
                const worksheet = workbook.Sheets['الموظفين'];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                for (const row of jsonData) {
                    if (row['الاسم'] && row['الشركة'] && row['المسمى الوظيفي'] && row['رقم الهاتف'] && row['الوردية']) {
                        const employee = {
                            name: row['الاسم'],
                            company: row['الشركة'],
                            position: row['المسمى الوظيفي'],
                            phone: row['رقم الهاتف'],
                            shift: row['الوردية'],
                            status: row['الحالة'] || 'نشط',
                            timestamp: new Date()
                        };
                        
                        const docId = await saveToFirestore('employees', employee);
                        employee.id = docId;
                        employees.push(employee);
                    }
                }
            }
            
            // استيراد بيانات المخزون
            if (workbook.SheetNames.includes('المخزون')) {
                const worksheet = workbook.Sheets['المخزون'];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                for (const row of jsonData) {
                    if (row['اسم المعدة'] && row['النوع'] && row['المقاس'] && row['الكمية']) {
                        const item = {
                            name: row['اسم المعدة'],
                            type: row['النوع'],
                            size: row['المقاس'],
                            quantity: parseInt(row['الكمية']) || 0,
                            status: (parseInt(row['الكمية']) || 0) > 0 ? 'متوفر' : 'غير متوفر',
                            timestamp: new Date()
                        };
                        
                        const docId = await saveToFirestore('inventory', item);
                        item.id = docId;
                        inventory.push(item);
                    }
                }
            }
            
            updateEmployeeTable();
            updateInventoryTable();
            updateDashboard();
            showNotification('تم استيراد البيانات بنجاح', 'success');
            
        } catch (error) {
            console.error('خطأ في استيراد الملف:', error);
            showNotification('خطأ في استيراد الملف. تأكد من صحة تنسيق الملف', 'error');
        }
    };
    
    reader.readAsArrayBuffer(file);
    event.target.value = ''; // إعادة تعيين input
}

// وظائف إدارة البيانات
async function clearAllData() {
    if (currentUser.role !== 'admin') {
        showNotification('ليس لديك صلاحية لمسح البيانات', 'error');
        return;
    }
    
    const confirmation = prompt('لتأكيد مسح جميع البيانات، اكتب كلمة "مسح" في المربع أدناه:');
    
    if (confirmation === 'مسح') {
        try {
            await clearAllFirestoreData();
            
            employees = [];
            inventory = [];
            assignments = [];
            
            updateEmployeeTable();
            updateInventoryTable();
            updateAssignmentTable();
            updateDashboard();
            updateUserStats();
            
            showNotification('تم مسح جميع البيانات بنجاح', 'success');
        } catch (error) {
            console.error('خطأ في مسح البيانات:', error);
            showNotification('خطأ في مسح البيانات', 'error');
        }
    } else {
        showNotification('تم إلغاء عملية المسح', 'info');
    }
}

// وظائف إدارة المستخدمين
function updateUserStats() {
    const totalUsers = defaultUsers.length;
    const adminUsers = defaultUsers.filter(user => user.role === 'admin').length;
    const regularUsers = defaultUsers.filter(user => user.role === 'user').length;
    const viewerUsers = defaultUsers.filter(user => user.role === 'viewer').length;
    
    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('adminUsers').textContent = adminUsers;
    document.getElementById('regularUsers').textContent = regularUsers;
    document.getElementById('viewerUsers').textContent = viewerUsers;
}

// وظائف مساعدة
function showNotification(message, type = 'info') {
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    };
    
    const notification = document.createElement('div');
    notification.className = `alert ${alertClass[type]} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

function showTab(tabName) {
    // إخفاء جميع التبويبات
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.style.display = 'none');
    
    // إظهار التبويب المحدد
    document.getElementById(tabName).style.display = 'block';
    
    // تحديث الأزرار النشطة
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // تحديث قوائم الاختيار عند فتح تبويب التسليم
    if (tabName === 'assignments') {
        updateAssignmentSelects();
    }
}

function updateAssignmentSelects() {
    // تحديث قائمة الموظفين
    const employeeSelect = document.getElementById('assignEmployee');
    employeeSelect.innerHTML = '<option value="">اختر الموظف</option>';
    employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = `${employee.name} - ${employee.company}`;
        employeeSelect.appendChild(option);
    });
    
    // تحديث قائمة المعدات
    const itemSelect = document.getElementById('assignItem');
    itemSelect.innerHTML = '<option value="">اختر المعدة</option>';
    inventory.filter(item => item.quantity > 0).forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `${item.name} - ${item.type} (متوفر: ${item.quantity})`;
        itemSelect.appendChild(option);
    });
}

// تهيئة التطبيق عند تحميل الصفحة
function initializeMainContent() {
    document.getElementById("logoutBtn").addEventListener("click", logout);
    document.getElementById("addEmployeeBtn").addEventListener("click", addEmployee);
    document.getElementById("addInventoryBtn").addEventListener("click", addInventoryItem);
    document.getElementById("addAssignmentBtn").addEventListener("click", addAssignment);
    document.getElementById("clearDataBtn").addEventListener("click", clearAllData);
    document.getElementById("exportBtn").addEventListener("click", exportToExcel);
    document.getElementById("importBtn").addEventListener("change", handleFileImport);
    document.getElementById("generateInventoryReportBtn").addEventListener("click", generateInventoryReport);
    document.getElementById("generateAssignmentReportBtn").addEventListener("click", generateAssignmentReport);

    // إظهار التبويب الأول افتراضياً
    showTab("dashboard");

    console.log("تم تهيئة محتوى الصفحة الرئيسية بنجاح");
}

document.addEventListener("DOMContentLoaded", function() {
    // ربط الأحداث
    document.getElementById("loginBtn").addEventListener("click", login);

    // التحقق من وجود مستخدم مسجل دخوله مسبقاً
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        document.getElementById("loginSection").style.display = "none";
        document.getElementById("mainContent").style.display = "block";
        updateUserInterface();
        loadAllData();
        initializeMainContent(); // تهيئة محتوى الصفحة الرئيسية
    }
});

// وظائف إضافية للتحكم في الواجهة
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('collapsed');
}

// معالجة الأخطاء العامة
window.addEventListener('error', function(e) {
    console.error('خطأ في التطبيق:', e.error);
    showNotification('حدث خطأ في التطبيق', 'error');
});

// معالجة أخطاء Firebase
window.addEventListener('unhandledrejection', function(e) {
    console.error('خطأ في Firebase:', e.reason);
    if (e.reason.code === 'resource-exhausted') {
        showNotification('تم تجاوز حصة Firebase. يتم استخدام التخزين المحلي كبديل.', 'warning');
    }
});

