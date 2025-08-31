// تكوين Firebase الجديد
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// تكوين Firebase الجديد مع حصة جديدة
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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
        const docRef = await addDoc(collection(db, collectionName), data);
        console.log(`تم حفظ البيانات في ${collectionName} بنجاح`);
        return docRef.id;
    } catch (error) {
        console.error(`خطأ في حفظ البيانات في ${collectionName}:`, error);
        // حفظ احتياطي محلي
        saveToLocalStorage(collectionName, data);
        throw error;
    }
}

async function loadFromFirestore(collectionName) {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const data = [];
        querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });
        console.log(`تم تحميل البيانات من ${collectionName} بنجاح`);
        return data;
    } catch (error) {
        console.error(`خطأ في تحميل البيانات من ${collectionName}:`, error);
        // تحميل احتياطي محلي
        return loadFromLocalStorage(collectionName);
    }
}

async function updateInFirestore(collectionName, docId, data) {
    try {
        await updateDoc(doc(db, collectionName, docId), data);
        console.log(`تم تحديث البيانات في ${collectionName} بنجاح`);
    } catch (error) {
        console.error(`خطأ في تحديث البيانات في ${collectionName}:`, error);
        throw error;
    }
}

async function deleteFromFirestore(collectionName, docId) {
    try {
        await deleteDoc(doc(db, collectionName, docId));
        console.log(`تم حذف البيانات من ${collectionName} بنجاح`);
    } catch (error) {
        console.error(`خطأ في حذف البيانات من ${collectionName}:`, error);
        throw error;
    }
}

// وظائف الحفظ المحلي الاحتياطي
function saveToLocalStorage(key, data) {
    try {
        const existingData = JSON.parse(localStorage.getItem(key) || '[]');
        existingData.push({ ...data, id: Date.now().toString(), timestamp: new Date().toISOString() });
        localStorage.setItem(key, JSON.stringify(existingData));
        console.log(`تم الحفظ الاحتياطي محلياً في ${key}`);
    } catch (error) {
        console.error(`خطأ في الحفظ المحلي:`, error);
    }
}

function loadFromLocalStorage(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (error) {
        console.error(`خطأ في التحميل المحلي:`, error);
        return [];
    }
}

// تحميل البيانات عند بدء التطبيق
async function loadAllData() {
    try {
        console.log('بدء تحميل البيانات من Firebase...');
        
        // تحميل البيانات من Firebase
        employees = await loadFromFirestore('employees');
        inventory = await loadFromFirestore('inventory');
        assignments = await loadFromFirestore('assignments');
        
        // تحديث الواجهة
        updateEmployeeTable();
        updateInventoryTable();
        updateAssignmentTable();
        updateDashboard();
        
        console.log('تم تحميل البيانات بنجاح من Firebase');
        showNotification('تم تحميل البيانات بنجاح', 'success');
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        showNotification('خطأ في تحميل البيانات، سيتم استخدام البيانات المحلية', 'warning');
        
        // تحميل البيانات المحلية كبديل
        employees = loadFromLocalStorage('employees');
        inventory = loadFromLocalStorage('inventory');
        assignments = loadFromLocalStorage('assignments');
        
        updateEmployeeTable();
        updateInventoryTable();
        updateAssignmentTable();
        updateDashboard();
    }
}

// وظائف تسجيل الدخول
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const user = defaultUsers.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        // إظهار/إخفاء عناصر حسب الصلاحيات
        updateUIBasedOnRole();
        
        // تحميل البيانات
        loadAllData();
        
        showNotification(`مرحباً ${user.name}`, 'success');
    } else {
        showNotification('اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
    }
}

function logout() {
    currentUser = null;
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

function updateUIBasedOnRole() {
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    // إظهار/إخفاء عناصر الإدارة
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(element => {
        element.style.display = isAdmin ? 'block' : 'none';
    });
    
    // إظهار/إخفاء أزرار الحذف
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.style.display = isAdmin ? 'inline-block' : 'none';
    });
}

// وظائف إدارة الموظفين
async function addEmployee() {
    if (!hasPermission('write')) {
        showNotification('ليس لديك صلاحية لإضافة الموظفين', 'error');
        return;
    }
    
    const name = document.getElementById('employeeName').value;
    const company = document.getElementById('employeeCompany').value;
    const position = document.getElementById('employeePosition').value;
    const phone = document.getElementById('employeePhone').value;
    const shift = document.getElementById('employeeShift').value;
    const status = document.getElementById('employeeStatus').value;
    
    if (!name || !company || !position) {
        showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    const employee = {
        name,
        company,
        position,
        phone: phone || '',
        shift,
        status,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.username
    };
    
    try {
        const docId = await saveToFirestore('employees', employee);
        employee.id = docId;
        employees.push(employee);
        
        updateEmployeeTable();
        updateDashboard();
        closeModal('employeeModal');
        clearEmployeeForm();
        
        showNotification('تم إضافة الموظف بنجاح', 'success');
    } catch (error) {
        showNotification('خطأ في إضافة الموظف', 'error');
    }
}

async function editEmployee(id) {
    if (!hasPermission('write')) {
        showNotification('ليس لديك صلاحية لتعديل الموظفين', 'error');
        return;
    }
    
    const employee = employees.find(emp => emp.id === id);
    if (!employee) return;
    
    // ملء النموذج بالبيانات الحالية
    document.getElementById('employeeName').value = employee.name;
    document.getElementById('employeeCompany').value = employee.company;
    document.getElementById('employeePosition').value = employee.position;
    document.getElementById('employeePhone').value = employee.phone || '';
    document.getElementById('employeeShift').value = employee.shift;
    document.getElementById('employeeStatus').value = employee.status;
    
    // تغيير وظيفة الزر للتحديث
    const saveBtn = document.querySelector('#employeeModal .btn-primary');
    saveBtn.textContent = 'تحديث';
    saveBtn.onclick = () => updateEmployee(id);
    
    openModal('employeeModal');
}

async function updateEmployee(id) {
    const name = document.getElementById('employeeName').value;
    const company = document.getElementById('employeeCompany').value;
    const position = document.getElementById('employeePosition').value;
    const phone = document.getElementById('employeePhone').value;
    const shift = document.getElementById('employeeShift').value;
    const status = document.getElementById('employeeStatus').value;
    
    if (!name || !company || !position) {
        showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    const updatedData = {
        name,
        company,
        position,
        phone: phone || '',
        shift,
        status,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.username
    };
    
    try {
        await updateInFirestore('employees', id, updatedData);
        
        const employeeIndex = employees.findIndex(emp => emp.id === id);
        if (employeeIndex !== -1) {
            employees[employeeIndex] = { ...employees[employeeIndex], ...updatedData };
        }
        
        updateEmployeeTable();
        updateDashboard();
        closeModal('employeeModal');
        clearEmployeeForm();
        
        showNotification('تم تحديث الموظف بنجاح', 'success');
    } catch (error) {
        showNotification('خطأ في تحديث الموظف', 'error');
    }
}

async function deleteEmployee(id) {
    if (!hasPermission('delete')) {
        showNotification('ليس لديك صلاحية لحذف الموظفين', 'error');
        return;
    }
    
    if (!confirm('هل أنت متأكد من حذف هذا الموظف؟')) return;
    
    try {
        await deleteFromFirestore('employees', id);
        employees = employees.filter(emp => emp.id !== id);
        
        updateEmployeeTable();
        updateDashboard();
        
        showNotification('تم حذف الموظف بنجاح', 'success');
    } catch (error) {
        showNotification('خطأ في حذف الموظف', 'error');
    }
}

// وظائف إدارة المخزون
async function addInventoryItem() {
    if (!hasPermission('write')) {
        showNotification('ليس لديك صلاحية لإضافة عناصر المخزون', 'error');
        return;
    }
    
    const name = document.getElementById('itemName').value;
    const type = document.getElementById('itemType').value;
    const size = document.getElementById('itemSize').value;
    const quantity = parseInt(document.getElementById('itemQuantity').value);
    const minQuantity = parseInt(document.getElementById('itemMinQuantity').value);
    
    if (!name || !type || !size || isNaN(quantity) || isNaN(minQuantity)) {
        showNotification('يرجى ملء جميع الحقول بشكل صحيح', 'error');
        return;
    }
    
    const item = {
        name,
        type,
        size,
        quantity,
        minQuantity,
        status: quantity > minQuantity ? 'متوفر' : 'ناقص',
        createdAt: new Date().toISOString(),
        createdBy: currentUser.username
    };
    
    try {
        const docId = await saveToFirestore('inventory', item);
        item.id = docId;
        inventory.push(item);
        
        updateInventoryTable();
        updateDashboard();
        closeModal('inventoryModal');
        clearInventoryForm();
        
        showNotification('تم إضافة العنصر بنجاح', 'success');
    } catch (error) {
        showNotification('خطأ في إضافة العنصر', 'error');
    }
}

async function editInventoryItem(id) {
    if (!hasPermission('write')) {
        showNotification('ليس لديك صلاحية لتعديل المخزون', 'error');
        return;
    }
    
    const item = inventory.find(inv => inv.id === id);
    if (!item) return;
    
    // ملء النموذج بالبيانات الحالية
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemType').value = item.type;
    document.getElementById('itemSize').value = item.size;
    document.getElementById('itemQuantity').value = item.quantity;
    document.getElementById('itemMinQuantity').value = item.minQuantity;
    
    // تغيير وظيفة الزر للتحديث
    const saveBtn = document.querySelector('#inventoryModal .btn-primary');
    saveBtn.textContent = 'تحديث';
    saveBtn.onclick = () => updateInventoryItem(id);
    
    openModal('inventoryModal');
}

async function updateInventoryItem(id) {
    const name = document.getElementById('itemName').value;
    const type = document.getElementById('itemType').value;
    const size = document.getElementById('itemSize').value;
    const quantity = parseInt(document.getElementById('itemQuantity').value);
    const minQuantity = parseInt(document.getElementById('itemMinQuantity').value);
    
    if (!name || !type || !size || isNaN(quantity) || isNaN(minQuantity)) {
        showNotification('يرجى ملء جميع الحقول بشكل صحيح', 'error');
        return;
    }
    
    const updatedData = {
        name,
        type,
        size,
        quantity,
        minQuantity,
        status: quantity > minQuantity ? 'متوفر' : 'ناقص',
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.username
    };
    
    try {
        await updateInFirestore('inventory', id, updatedData);
        
        const itemIndex = inventory.findIndex(inv => inv.id === id);
        if (itemIndex !== -1) {
            inventory[itemIndex] = { ...inventory[itemIndex], ...updatedData };
        }
        
        updateInventoryTable();
        updateDashboard();
        closeModal('inventoryModal');
        clearInventoryForm();
        
        showNotification('تم تحديث العنصر بنجاح', 'success');
    } catch (error) {
        showNotification('خطأ في تحديث العنصر', 'error');
    }
}

async function deleteInventoryItem(id) {
    if (!hasPermission('delete')) {
        showNotification('ليس لديك صلاحية لحذف عناصر المخزون', 'error');
        return;
    }
    
    if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;
    
    try {
        await deleteFromFirestore('inventory', id);
        inventory = inventory.filter(inv => inv.id !== id);
        
        updateInventoryTable();
        updateDashboard();
        
        showNotification('تم حذف العنصر بنجاح', 'success');
    } catch (error) {
        showNotification('خطأ في حذف العنصر', 'error');
    }
}

// وظائف تسليم المعدات
async function addAssignment() {
    if (!hasPermission('write')) {
        showNotification('ليس لديك صلاحية لإضافة تسليمات', 'error');
        return;
    }
    
    const employeeId = document.getElementById('assignmentEmployee').value;
    const itemId = document.getElementById('assignmentItem').value;
    const quantity = parseInt(document.getElementById('assignmentQuantity').value);
    const reason = document.getElementById('assignmentReason').value;
    
    if (!employeeId || !itemId || isNaN(quantity) || quantity <= 0) {
        showNotification('يرجى ملء جميع الحقول بشكل صحيح', 'error');
        return;
    }
    
    const employee = employees.find(emp => emp.id === employeeId);
    const item = inventory.find(inv => inv.id === itemId);
    
    if (!employee || !item) {
        showNotification('الموظف أو العنصر غير موجود', 'error');
        return;
    }
    
    if (item.quantity < quantity) {
        showNotification('الكمية المطلوبة غير متوفرة في المخزون', 'error');
        return;
    }
    
    const assignment = {
        employeeId,
        employeeName: employee.name,
        itemId,
        itemName: item.name,
        itemSize: item.size,
        quantity,
        reason: reason || 'تسليم عادي',
        date: new Date().toISOString(),
        assignedBy: currentUser.username
    };
    
    try {
        // إضافة التسليم
        const docId = await saveToFirestore('assignments', assignment);
        assignment.id = docId;
        assignments.push(assignment);
        
        // تحديث المخزون
        item.quantity -= quantity;
        item.status = item.quantity > item.minQuantity ? 'متوفر' : 'ناقص';
        await updateInFirestore('inventory', itemId, {
            quantity: item.quantity,
            status: item.status,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser.username
        });
        
        updateAssignmentTable();
        updateInventoryTable();
        updateDashboard();
        closeModal('assignmentModal');
        clearAssignmentForm();
        
        showNotification('تم تسليم المعدة بنجاح', 'success');
    } catch (error) {
        showNotification('خطأ في تسليم المعدة', 'error');
    }
}

// وظائف مساعدة
function hasPermission(action) {
    if (!currentUser) return false;
    
    switch (action) {
        case 'read':
            return true; // جميع المستخدمين يمكنهم القراءة
        case 'write':
            return currentUser.role === 'admin' || currentUser.role === 'user';
        case 'delete':
            return currentUser.role === 'admin';
        default:
            return false;
    }
}

function showNotification(message, type = 'info') {
    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // إضافة الإشعار للصفحة
    document.body.appendChild(notification);
    
    // إزالة الإشعار بعد 3 ثوان
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    
    // إعادة تعيين أزرار الحفظ
    const saveButtons = document.querySelectorAll('#' + modalId + ' .btn-primary');
    saveButtons.forEach(btn => {
        if (modalId === 'employeeModal') {
            btn.textContent = 'حفظ';
            btn.onclick = addEmployee;
        } else if (modalId === 'inventoryModal') {
            btn.textContent = 'حفظ';
            btn.onclick = addInventoryItem;
        }
    });
}

function clearEmployeeForm() {
    document.getElementById('employeeName').value = '';
    document.getElementById('employeeCompany').value = '';
    document.getElementById('employeePosition').value = '';
    document.getElementById('employeePhone').value = '';
    document.getElementById('employeeShift').value = 'صباحي';
    document.getElementById('employeeStatus').value = 'نشط';
}

function clearInventoryForm() {
    document.getElementById('itemName').value = '';
    document.getElementById('itemType').value = '';
    document.getElementById('itemSize').value = '';
    document.getElementById('itemQuantity').value = '';
    document.getElementById('itemMinQuantity').value = '';
}

function clearAssignmentForm() {
    document.getElementById('assignmentEmployee').value = '';
    document.getElementById('assignmentItem').value = '';
    document.getElementById('assignmentQuantity').value = '';
    document.getElementById('assignmentReason').value = '';
}

// وظائف تحديث الجداول
function updateEmployeeTable() {
    const tbody = document.querySelector('#employeeTable tbody');
    tbody.innerHTML = '';
    
    employees.forEach(employee => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${employee.name}</td>
            <td>${employee.company}</td>
            <td>${employee.position}</td>
            <td>${employee.phone || '-'}</td>
            <td>${employee.shift}</td>
            <td><span class="status ${employee.status}">${employee.status}</span></td>
            <td>
                <button onclick="editEmployee('${employee.id}')" class="btn btn-sm btn-secondary">تعديل</button>
                <button onclick="deleteEmployee('${employee.id}')" class="btn btn-sm btn-danger delete-btn" style="display: ${hasPermission('delete') ? 'inline-block' : 'none'}">حذف</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateInventoryTable() {
    const tbody = document.querySelector('#inventoryTable tbody');
    tbody.innerHTML = '';
    
    inventory.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.type}</td>
            <td>${item.size}</td>
            <td>${item.quantity}</td>
            <td>${item.minQuantity}</td>
            <td><span class="status ${item.status}">${item.status}</span></td>
            <td>
                <button onclick="editInventoryItem('${item.id}')" class="btn btn-sm btn-secondary">تعديل</button>
                <button onclick="deleteInventoryItem('${item.id}')" class="btn btn-sm btn-danger delete-btn" style="display: ${hasPermission('delete') ? 'inline-block' : 'none'}">حذف</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateAssignmentTable() {
    const tbody = document.querySelector('#assignmentTable tbody');
    tbody.innerHTML = '';
    
    assignments.forEach(assignment => {
        const row = document.createElement('tr');
        const date = new Date(assignment.date).toLocaleDateString('ar-SA');
        row.innerHTML = `
            <td>${date}</td>
            <td>${assignment.employeeName}</td>
            <td>${assignment.itemName}</td>
            <td>${assignment.itemSize}</td>
            <td>${assignment.quantity}</td>
            <td>${assignment.reason}</td>
        `;
        tbody.appendChild(row);
    });
}

function updateDashboard() {
    // تحديث إحصائيات لوحة التحكم
    document.getElementById('totalEmployees').textContent = employees.length;
    document.getElementById('activeEmployees').textContent = employees.filter(emp => emp.status === 'نشط').length;
    document.getElementById('totalItems').textContent = inventory.length;
    document.getElementById('lowStockItems').textContent = inventory.filter(item => item.quantity <= item.minQuantity).length;
    document.getElementById('totalAssignments').textContent = assignments.length;
    
    // تحديث قوائم التسليم
    updateAssignmentSelects();
}

function updateAssignmentSelects() {
    const employeeSelect = document.getElementById('assignmentEmployee');
    const itemSelect = document.getElementById('assignmentItem');
    
    // تحديث قائمة الموظفين
    employeeSelect.innerHTML = '<option value="">اختر موظف</option>';
    employees.filter(emp => emp.status === 'نشط').forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = `${employee.name} - ${employee.company}`;
        employeeSelect.appendChild(option);
    });
    
    // تحديث قائمة المعدات
    itemSelect.innerHTML = '<option value="">اختر معدة</option>';
    inventory.filter(item => item.quantity > 0).forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `${item.name} - ${item.size} (متوفر: ${item.quantity})`;
        itemSelect.appendChild(option);
    });
}

// وظائف البحث والتصفية
function searchEmployees() {
    const searchTerm = document.getElementById('employeeSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#employeeTable tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function searchInventory() {
    const searchTerm = document.getElementById('inventorySearch').value.toLowerCase();
    const rows = document.querySelectorAll('#inventoryTable tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// وظائف استيراد وتصدير البيانات
async function handleFileImport(event) {
    if (!hasPermission('write')) {
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
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            if (jsonData.length === 0) {
                showNotification('الملف فارغ أو لا يحتوي على بيانات صالحة', 'error');
                return;
            }
            
            // التحقق من صحة البيانات
            const validData = jsonData.filter(row => {
                return row['الاسم'] && row['الشركة'] && row['المسمى الوظيفي'];
            });
            
            if (validData.length === 0) {
                showNotification('لا توجد بيانات صالحة في الملف. تأكد من وجود الأعمدة: الاسم، الشركة، المسمى الوظيفي', 'error');
                return;
            }
            
            // عرض معاينة البيانات
            const preview = validData.slice(0, 5).map(row => 
                `${row['الاسم']} - ${row['الشركة']} - ${row['المسمى الوظيفي']}`
            ).join('\n');
            
            const confirmImport = confirm(`سيتم استيراد ${validData.length} موظف. معاينة البيانات:\n\n${preview}\n\nهل تريد المتابعة؟`);
            
            if (!confirmImport) return;
            
            // استيراد البيانات
            let importedCount = 0;
            for (const row of validData) {
                try {
                    const employee = {
                        name: row['الاسم'],
                        company: row['الشركة'],
                        position: row['المسمى الوظيفي'],
                        phone: row['رقم الهاتف'] || '',
                        shift: row['الوردية'] || 'صباحي',
                        status: row['الحالة'] || 'نشط',
                        createdAt: new Date().toISOString(),
                        createdBy: currentUser.username,
                        importedAt: new Date().toISOString()
                    };
                    
                    const docId = await saveToFirestore('employees', employee);
                    employee.id = docId;
                    employees.push(employee);
                    importedCount++;
                } catch (error) {
                    console.error('خطأ في استيراد موظف:', error);
                }
            }
            
            updateEmployeeTable();
            updateDashboard();
            
            showNotification(`تم استيراد ${importedCount} موظف بنجاح`, 'success');
            
        } catch (error) {
            console.error('خطأ في قراءة الملف:', error);
            showNotification('خطأ في قراءة الملف. تأكد من أن الملف بصيغة Excel صحيحة', 'error');
        }
    };
    
    reader.readAsArrayBuffer(file);
    event.target.value = ''; // إعادة تعيين input
}

// وظائف مسح البيانات
async function clearAllData() {
    if (!hasPermission('delete')) {
        showNotification('ليس لديك صلاحية لمسح البيانات', 'error');
        return;
    }
    
    const confirmation = prompt('لمسح جميع البيانات، اكتب "مسح" في المربع أدناه:');
    
    if (confirmation !== 'مسح') {
        showNotification('تم إلغاء العملية', 'info');
        return;
    }
    
    const finalConfirm = confirm('هذا الإجراء سيحذف جميع البيانات نهائياً. هل أنت متأكد؟');
    
    if (!finalConfirm) return;
    
    try {
        // حذف جميع البيانات من Firebase
        const collections = ['employees', 'inventory', 'assignments'];
        
        for (const collectionName of collections) {
            const querySnapshot = await getDocs(collection(db, collectionName));
            const deletePromises = [];
            
            querySnapshot.forEach((doc) => {
                deletePromises.push(deleteFromFirestore(collectionName, doc.id));
            });
            
            await Promise.all(deletePromises);
        }
        
        // مسح البيانات المحلية
        employees = [];
        inventory = [];
        assignments = [];
        
        // مسح localStorage
        localStorage.removeItem('employees');
        localStorage.removeItem('inventory');
        localStorage.removeItem('assignments');
        
        // تحديث الواجهة
        updateEmployeeTable();
        updateInventoryTable();
        updateAssignmentTable();
        updateDashboard();
        
        showNotification('تم مسح جميع البيانات بنجاح', 'success');
        
    } catch (error) {
        console.error('خطأ في مسح البيانات:', error);
        showNotification('خطأ في مسح البيانات', 'error');
    }
}

// وظائف التنقل
function showSection(sectionId) {
    // إخفاء جميع الأقسام
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.style.display = 'none');
    
    // إظهار القسم المطلوب
    document.getElementById(sectionId).style.display = 'block';
    
    // تحديث حالة القائمة الجانبية
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    const activeItem = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('تم تحميل التطبيق');
    
    // إظهار قسم لوحة التحكم افتراضياً
    showSection('dashboard');
    
    // إضافة مستمعي الأحداث
    document.getElementById('loginBtn').addEventListener('click', login);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // مستمعي أحداث البحث
    document.getElementById('employeeSearch').addEventListener('input', searchEmployees);
    document.getElementById('inventorySearch').addEventListener('input', searchInventory);
    
    // مستمع حدث استيراد الملفات
    document.getElementById('fileImport').addEventListener('change', handleFileImport);
    
    // مستمع حدث Enter في نموذج تسجيل الدخول
    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
    
    console.log('تم تهيئة التطبيق بنجاح');
});

// تصدير الوظائف للاستخدام العام
window.login = login;
window.logout = logout;
window.showSection = showSection;
window.addEmployee = addEmployee;
window.editEmployee = editEmployee;
window.deleteEmployee = deleteEmployee;
window.addInventoryItem = addInventoryItem;
window.editInventoryItem = editInventoryItem;
window.deleteInventoryItem = deleteInventoryItem;
window.addAssignment = addAssignment;
window.openModal = openModal;
window.closeModal = closeModal;
window.clearAllData = clearAllData;
window.searchEmployees = searchEmployees;
window.searchInventory = searchInventory;

