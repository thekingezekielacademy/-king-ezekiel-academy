// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar background change on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll('.program-card, .stat-item, .achievement-highlight, .contact-item');
    
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Form submission handling
const contactForm = document.querySelector('.contact-form form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(contactForm);
        const name = contactForm.querySelector('input[type="text"]').value;
        const email = contactForm.querySelector('input[type="email"]').value;
        const phone = contactForm.querySelector('input[type="tel"]').value;
        const message = contactForm.querySelector('textarea').value;
        
        // Simple validation
        if (!name || !email || !message) {
            alert('Please fill in all required fields.');
            return;
        }
        
        // Simulate form submission
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;
        
        setTimeout(() => {
            alert('Thank you for your message! We will get back to you soon.');
            contactForm.reset();
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 2000);
    });
}

// Newsletter subscription
const newsletterForm = document.querySelector('.newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = newsletterForm.querySelector('input[type="email"]').value;
        
        if (!email) {
            alert('Please enter your email address.');
            return;
        }
        
        const submitBtn = newsletterForm.querySelector('button');
        const originalHTML = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        setTimeout(() => {
            alert('Thank you for subscribing to our newsletter!');
            newsletterForm.querySelector('input').value = '';
            submitBtn.innerHTML = originalHTML;
        }, 1500);
    });
}

// Button click animations
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function(e) {
        // Create ripple effect
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// Add ripple effect styles
const style = document.createElement('style');
style.textContent = `
    .btn {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Counter animation for statistics
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target + (element.textContent.includes('+') ? '+' : '');
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start) + (element.textContent.includes('+') ? '+' : '');
        }
    }, 16);
}

// Animate counters when they come into view
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const target = entry.target;
            const text = target.textContent;
            const number = parseInt(text.replace(/\D/g, ''));
            
            if (number && !target.classList.contains('animated')) {
                target.classList.add('animated');
                animateCounter(target, number);
            }
        }
    });
}, { threshold: 0.5 });

// Observe counter elements
document.querySelectorAll('.stat-item h4, .highlight-number').forEach(counter => {
    counterObserver.observe(counter);
});

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    const rate = scrolled * -0.5;
    
    if (hero) {
        hero.style.transform = `translateY(${rate}px)`;
    }
});

// Add loading animation
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// Add loading styles
const loadingStyle = document.createElement('style');
loadingStyle.textContent = `
    body {
        opacity: 0;
        transition: opacity 0.5s ease;
    }
    
    body.loaded {
        opacity: 1;
    }
    
    .hero-content {
        opacity: 0;
        transform: translateY(30px);
        animation: fadeInUp 1s ease-out 0.3s forwards;
    }
    
    .hero-image {
        opacity: 0;
        transform: translateX(30px);
        animation: fadeInRight 1s ease-out 0.6s forwards;
    }
    
    @keyframes fadeInRight {
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(loadingStyle);

// Add hover effects for program cards
document.querySelectorAll('.program-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Add typing effect for hero title
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.innerHTML = '';
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Initialize typing effect when page loads
document.addEventListener('DOMContentLoaded', () => {
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        const originalText = heroTitle.textContent;
        setTimeout(() => {
            typeWriter(heroTitle, originalText, 50);
        }, 1000);
    }
});

// Add scroll progress indicator
const progressBar = document.createElement('div');
progressBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 0%;
    height: 3px;
    background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
    z-index: 9999;
    transition: width 0.1s ease;
`;
document.body.appendChild(progressBar);

window.addEventListener('scroll', () => {
    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercent = (scrollTop / scrollHeight) * 100;
    progressBar.style.width = scrollPercent + '%';
});

// Modal functionality
const signinModal = document.getElementById('signinModal');
const signupModal = document.getElementById('signupModal');
const signinForm = document.getElementById('signinForm');
const signupForm = document.getElementById('signupForm');

// Show modals
function showModal(modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Hide modals
function hideModal(modal) {
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === signinModal) {
        hideModal(signinModal);
    }
    if (e.target === signupModal) {
        hideModal(signupModal);
    }
});

// Close modals with X button
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        hideModal(signinModal);
        hideModal(signupModal);
    });
});

// Switch between modals
document.getElementById('switchToSignup').addEventListener('click', (e) => {
    e.preventDefault();
    hideModal(signinModal);
    showModal(signupModal);
});

document.getElementById('switchToSignin').addEventListener('click', (e) => {
    e.preventDefault();
    hideModal(signupModal);
    showModal(signinModal);
});

// Auth button functionality
document.querySelectorAll('.btn-signin').forEach(button => {
    button.addEventListener('click', () => {
        showModal(signinModal);
    });
});

document.querySelectorAll('.btn-signup').forEach(button => {
    button.addEventListener('click', () => {
        showModal(signupModal);
    });
});

// Password toggle functionality
document.querySelectorAll('.password-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
        const input = toggle.previousElementSibling;
        const icon = toggle.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
});

// Form validation and submission
signinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('signinEmail').value;
    const password = document.getElementById('signinPassword').value;
    const remember = document.querySelector('input[name="remember"]').checked;
    
    // Simple validation
    if (!email || !password) {
        showNotification('Please fill in all required fields.', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address.', 'error');
        return;
    }
    
    // Simulate authentication
    const submitBtn = signinForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        // Simulate successful login
        showNotification('Welcome back! You have successfully signed in.', 'success');
        hideModal(signinModal);
        signinForm.reset();
        
        // Update UI to show logged in state
        updateAuthState(true, email);
        
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 2000);
});

signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(signupForm);
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const email = formData.get('email');
    const phone = formData.get('phone');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const role = formData.get('role');
    const terms = formData.get('terms');
    const newsletter = formData.get('newsletter');
    
    // Validation
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword || !role) {
        showNotification('Please fill in all required fields.', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address.', 'error');
        return;
    }
    
    if (password.length < 8) {
        showNotification('Password must be at least 8 characters long.', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match.', 'error');
        return;
    }
    
    if (!terms) {
        showNotification('Please agree to the Terms & Conditions.', 'error');
        return;
    }
    
    // Simulate registration
    const submitBtn = signupForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        // Simulate successful registration
        showNotification(`Welcome ${firstName}! Your account has been created successfully.`, 'success');
        hideModal(signupModal);
        signupForm.reset();
        
        // Update UI to show logged in state
        updateAuthState(true, email);
        
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 2000);
});

// Social authentication
document.querySelectorAll('.btn-social').forEach(button => {
    button.addEventListener('click', () => {
        const provider = button.classList.contains('btn-google') ? 'Google' : 'Facebook';
        showNotification(`${provider} authentication coming soon!`, 'info');
    });
});

// Forgot password
document.querySelector('.forgot-password').addEventListener('click', (e) => {
    e.preventDefault();
    showNotification('Password reset functionality coming soon!', 'info');
});

// Utility functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        hideNotification(notification);
    }, 5000);
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        hideNotification(notification);
    });
}

function hideNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

function updateAuthState(isLoggedIn, email = '') {
    const authButtons = document.querySelectorAll('.nav-auth, .nav-auth-mobile');
    
    if (isLoggedIn) {
        // Replace auth buttons with user menu
        authButtons.forEach(container => {
            container.innerHTML = `
                <div class="user-menu">
                    <button class="btn btn-user">
                        <i class="fas fa-user-circle"></i>
                        ${email.split('@')[0]}
                    </button>
                    <div class="user-dropdown">
                        <a href="#"><i class="fas fa-user"></i> Profile</a>
                        <a href="#"><i class="fas fa-cog"></i> Settings</a>
                        <a href="#"><i class="fas fa-book"></i> My Courses</a>
                        <hr>
                        <a href="#" class="logout-btn"><i class="fas fa-sign-out-alt"></i> Sign Out</a>
                    </div>
                </div>
            `;
        });
        
        // Add logout functionality
        document.querySelectorAll('.logout-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                updateAuthState(false);
                showNotification('You have been signed out successfully.', 'success');
            });
        });
    } else {
        // Restore original auth buttons
        authButtons.forEach(container => {
            container.innerHTML = `
                <button class="btn btn-signin">
                    <i class="fas fa-sign-in-alt"></i>
                    Sign In
                </button>
                <button class="btn btn-signup">
                    <i class="fas fa-user-plus"></i>
                    Sign Up
                </button>
            `;
        });
        
        // Reattach event listeners
        document.querySelectorAll('.btn-signin').forEach(button => {
            button.addEventListener('click', () => {
                showModal(signinModal);
            });
        });
        
        document.querySelectorAll('.btn-signup').forEach(button => {
            button.addEventListener('click', () => {
                showModal(signupModal);
            });
        });
    }
}

// Hero button functionality
document.querySelector('.hero-buttons .btn-primary').addEventListener('click', () => {
    // Scroll to contact section or open enrollment form
    const contactSection = document.querySelector('#contact');
    if (contactSection) {
        contactSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
});

document.querySelector('.hero-buttons .btn-secondary').addEventListener('click', () => {
    // Add video modal or redirect to video
    alert('Watch our story video coming soon!');
}); 