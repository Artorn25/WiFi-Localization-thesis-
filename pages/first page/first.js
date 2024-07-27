document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const body = document.body;

    // สร้าง overlay element
    const overlay = document.createElement('div');
    overlay.classList.add('sidebar-overlay');
    body.appendChild(overlay);

    function toggleSidebar() {
        if (window.innerWidth < 768) {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
            body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
        } else {
            sidebar.classList.toggle('closed');
            mainContent.classList.toggle('full-width');
        }
    }

    sidebarToggle.addEventListener('click', toggleSidebar);

    // ปิด sidebar เมื่อคลิกที่ overlay
    overlay.addEventListener('click', function() {
        if (sidebar.classList.contains('open')) {
            toggleSidebar();
        }
    });

    // จัดการการปรับขนาดหน้าจอ
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 768) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            body.style.overflow = '';
            if (sidebar.classList.contains('closed')) {
                mainContent.classList.add('full-width');
            }
        } else {
            mainContent.classList.remove('full-width');
            sidebar.classList.remove('closed');
        }
    });

    // เพิ่ม effect hover ให้กับปุ่ม toggle
    sidebarToggle.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1)';
    });
    sidebarToggle.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
});