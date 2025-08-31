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

// وظائف تسجيل الدخول
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showNotification('يرجى إدخال اسم المستخدم وكلمة المرور', 'error');
        return;
    }
    
    const user = defaultUsers.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('mainContent').classList.remove('d-none');
        updateUserInterface();
        loadAllData();
        showNotification('تم تسجيل الدخول بنجاح', 'success');
    } else {
        showNotification('اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('mainContent').classList.add('d-none');
    showNotification('تم تسجيل الخروج بنجاح', 'info');
}

function updateUserInterface() {
    if (!currentUser) return;
    
    document.getElementById('currentUserName').textContent = currentUser.name;
    document.getElementById('currentUserRole').textContent = getRoleText(currentUser.role);
}

function getRoleText(role) {
    const roles = {
        'admin': 'مدير',
        'user': 'مستخدم عادي',
        'viewer': 'مشاهد فقط'
    };
    return roles[role] || 'غير محدد';
}

// تحميل البيانات من localStorage
function loadAllData() {
    try {
        employees = JSON.parse(localStorage.getItem('employees') || '[]');
        inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
        assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
        
        updateEmployeeTable();
        updateInventoryTable();
        updateAssignmentTable();
        updateDashboard();
        updateAssignmentSelects();
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        showNotification('خطأ في تحميل البيانات', 'error');
    }
}

// حفظ البيانات في localStorage
function saveData() {
    try {
        localStorage.setItem('employees', JSON.stringify(employees));
        localStorage.setItem('inventory', JSON.stringify(inventory));
        localStorage.setItem('assignments', JSON.stringify(assignments));
    } catch (error) {
        console.error('خطأ في حفظ البيانات:', error);
        showNotification('خطأ في حفظ البيانات', 'error');
    }
}

// وظائف إدارة الموظفين
function showAddEmployeeForm() {
    document.getElementById('addEmployeeForm').classList.remove('d-none');
}

function hideAddEmployeeForm() {
    document.getElementById('addEmployeeForm').classList.add('d-none');
    clearEmployeeForm();
}

function addEmployee() {
    const name = document.getElementById('employeeName').value;
    const company = document.getElementById('employeeCompany').value;
    const position = document.getElementById('employeePosition').value;
    const phone = document.getElementById('employeePhone').value;
    const shift = document.getElementById('employeeShift').value;
    
    if (!name || !company || !position || !phone || !shift) {
        showNotification('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    const employee = {
        id: Date.now().toString(),
        name,
        company,
        position,
        phone,
        shift,
        status: 'نشط',
        timestamp: new Date()
    };
    
    employees.push(employee);
    saveData();
    updateEmployeeTable();
    updateDashboard();
    updateAssignmentSelects();
    hideAddEmployeeForm();
    showNotification('تم إضافة الموظف بنجاح', 'success');
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
                <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${employee.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function deleteEmployee(id) {
    if (confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
        employees = employees.filter(emp => emp.id !== id);
        saveData();
        updateEmployeeTable();
        updateDashboard();
        updateAssignmentSelects();
        showNotification('تم حذف الموظف بنجاح', 'success');
    }
}

// وظائف إدارة المخزون
function showAddInventoryForm() {
    document.getElementById('addInventoryForm').classList.remove('d-none');
}

function hideAddInventoryForm() {
    document.getElementById('addInventoryForm').classList.add('d-none');
    clearInventoryForm();
}

function addInventoryItem() {
    const name = document.getElementById('itemName').value;
    const type = document.getElementById('itemType').value;
    const size = document.getElementById('itemSize').value;
    const quantity = parseInt(document.getElementById('itemQuantity').value);
    
    if (!name || !type || !size || !quantity) {
        showNotification('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    const item = {
        id: Date.now().toString(),
        name,
        type,
        size,
        quantity,
        status: quantity > 0 ? 'متوفر' : 'غير متوفر',
        timestamp: new Date()
    };
    
    inventory.push(item);
    saveData();
    updateInventoryTable();
    updateDashboard();
    updateAssignmentSelects();
    hideAddInventoryForm();
    showNotification('تم إضافة المعدة بنجاح', 'success');
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
                <button class="btn btn-sm btn-danger" onclick="deleteInventoryItem('${item.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function deleteInventoryItem(id) {
    if (confirm('هل أنت متأكد من حذف هذه المعدة؟')) {
        inventory = inventory.filter(item => item.id !== id);
        saveData();
        updateInventoryTable();
        updateDashboard();
        updateAssignmentSelects();
        showNotification('تم حذف المعدة بنجاح', 'success');
    }
}

// وظائف تسليم المعدات
function addAssignment() {
    const employeeId = document.getElementById('assignEmployee').value;
    const itemId = document.getElementById('assignItem').value;
    const size = document.getElementById('assignSize').value;
    const quantity = parseInt(document.getElementById('assignQuantity').value);
    const reason = document.getElementById('assignReason').value;
    
    if (!employeeId || !itemId || !size || !quantity || !reason) {
        showNotification('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    const employee = employees.find(emp => emp.id === employeeId);
    const item = inventory.find(inv => inv.id === itemId);
    
    if (!employee || !item) {
        showNotification('بيانات غير صحيحة', 'error');
        return;
    }
    
    if (item.quantity < quantity) {
        showNotification('الكمية المطلوبة غير متوفرة في المخزون', 'error');
        return;
    }
    
    const assignment = {
        id: Date.now().toString(),
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
    
    assignments.push(assignment);
    
    // تحديث المخزون
    item.quantity -= quantity;
    item.status = item.quantity > 0 ? 'متوفر' : 'غير متوفر';
    
    saveData();
    updateAssignmentTable();
    updateInventoryTable();
    updateDashboard();
    updateAssignmentSelects();
    clearAssignmentForm();
    showNotification('تم تسليم المعدة بنجاح', 'success');
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

// وظائف لوحة التحكم
function updateDashboard() {
    document.getElementById('totalEmployees').textContent = employees.length;
    document.getElementById('totalItems').textContent = inventory.length;
    document.getElementById('totalAssignments').textContent = assignments.length;
    document.getElementById('lowStockItems').textContent = inventory.filter(item => item.quantity < 5).length;
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

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // استيراد بيانات الموظفين
            if (workbook.SheetNames.includes('الموظفين')) {
                const worksheet = workbook.Sheets['الموظفين'];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                jsonData.forEach(row => {
                    if (row['الاسم'] && row['الشركة'] && row['المسمى الوظيفي'] && row['رقم الهاتف'] && row['الوردية']) {
                        const employee = {
                            id: Date.now().toString() + Math.random(),
                            name: row['الاسم'],
                            company: row['الشركة'],
                            position: row['المسمى الوظيفي'],
                            phone: row['رقم الهاتف'],
                            shift: row['الوردية'],
                            status: row['الحالة'] || 'نشط',
                            timestamp: new Date()
                        };
                        employees.push(employee);
                    }
                });
            }
            
            // استيراد بيانات المخزون
            if (workbook.SheetNames.includes('المخزون')) {
                const worksheet = workbook.Sheets['المخزون'];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                jsonData.forEach(row => {
                    if (row['اسم المعدة'] && row['النوع'] && row['المقاس'] && row['الكمية']) {
                        const item = {
                            id: Date.now().toString() + Math.random(),
                            name: row['اسم المعدة'],
                            type: row['النوع'],
                            size: row['المقاس'],
                            quantity: parseInt(row['الكمية']) || 0,
                            status: (parseInt(row['الكمية']) || 0) > 0 ? 'متوفر' : 'غير متوفر',
                            timestamp: new Date()
                        };
                        inventory.push(item);
                    }
                });
            }
            
            saveData();
            updateEmployeeTable();
            updateInventoryTable();
            updateDashboard();
            updateAssignmentSelects();
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
function clearAllData() {
    const confirmation = prompt('لتأكيد مسح جميع البيانات، اكتب كلمة "مسح" في المربع أدناه:');
    
    if (confirmation === 'مسح') {
        employees = [];
        inventory = [];
        assignments = [];
        
        saveData();
        updateEmployeeTable();
        updateInventoryTable();
        updateAssignmentTable();
        updateDashboard();
        updateAssignmentSelects();
        
        showNotification('تم مسح جميع البيانات بنجاح', 'success');
    } else {
        showNotification('تم إلغاء عملية المسح', 'info');
    }
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
    notification.className = `alert ${alertClass[type]} alert-dismissible fade show`;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
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
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // إظهار التبويب المحدد
    document.getElementById(tabName).classList.add('active');
    
    // تحديث الأزرار النشطة
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // تحديث قوائم الاختيار عند فتح تبويب التسليم
    if (tabName === 'assignments') {
        updateAssignmentSelects();
    }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('تم تحميل الصفحة');
    
    // التحقق من وجود مستخدم مسجل دخوله مسبقاً
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('mainContent').classList.remove('d-none');
        updateUserInterface();
        loadAllData();
    }
    
    // ربط الأحداث
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', login);
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
        importBtn.addEventListener('change', handleFileImport);
    }
    
    console.log('تم تحميل النظام بنجاح');
});

