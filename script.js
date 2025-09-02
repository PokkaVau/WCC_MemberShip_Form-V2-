// ===== refs =====
const form = document.getElementById('wccForm');
const feedback = document.getElementById('form-feedback');
const successMsg = document.getElementById('successMsg');
const submitBtn = document.getElementById('submitBtn');

// GAS Web App URL
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbziM0N_zWTI_AaSND5OaRryr-SGSj3Sw8D4SKpXtnJ5XeCF5B3WM_5IcGmW-BBR5fs/exec';

// ===== helpers =====
function showFeedback(message, success = true) {
  feedback.textContent = message;
  feedback.className = 'feedback ' + (success ? 'success' : 'error');
  feedback.style.display = 'block';
  requestAnimationFrame(() => {
    feedback.style.opacity = '1';
    feedback.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    feedback.style.opacity = '0';
    feedback.style.transform = 'translateX(-50%) translateY(-18px)';
    setTimeout(() => { feedback.style.display = 'none'; }, 700);
  }, 2500);
}

// Convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]; // Remove data:image/xxx;base64, prefix
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

// Focus glow
document.querySelectorAll('input, textarea, select').forEach((el) => {
  el.addEventListener('focus', function () { this.style.boxShadow = '0 0 12px #fdc77155'; });
  el.addEventListener('blur', function () { this.style.boxShadow = ''; });
});

// ===== main submit handler =====
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Basic validation
  let firstInvalid = null;
  [...form.elements].forEach((el) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) {
      if (el.required && !el.value) {
        el.classList.add('shake');
        if (!firstInvalid) firstInvalid = el;
        setTimeout(() => el.classList.remove('shake'), 600);
      }
    }
  });
  if (firstInvalid) {
    showFeedback('সব প্রয়োজনীয় তথ্য দিন।', false);
    firstInvalid.focus();
    submitBtn.classList.add('shake');
    setTimeout(() => submitBtn.classList.remove('shake'), 550);
    return;
  }

  // File validation
  const photoInput = form.querySelector('input[name="photo"]');
  if (!photoInput || !photoInput.files || !photoInput.files[0]) {
    showFeedback('দয়া করে একটি ছবি নির্বাচন করুন।', false);
    if (photoInput) photoInput.focus();
    return;
  }

  const file = photoInput.files[0];
  if (file.size > 2 * 1024 * 1024) {
    showFeedback('ছবির সাইজ 2MB এর কম হতে হবে।', false);
    photoInput.focus();
    return;
  }

  submitBtn.innerHTML = '⏳ প্রসেসিং হচ্ছে...';
  submitBtn.disabled = true;

  try {
    // Convert image to base64
    showFeedback('ছবি প্রস্তুত করা হচ্ছে...', true);
    const base64Image = await fileToBase64(file);
    
    // Prepare form data
    const formData = new FormData();
    
    // Add all form fields
    [...form.elements].forEach(el => {
      if (el.name && el.name !== 'photo' && el.value) {
        formData.append(el.name, el.value);
      }
    });
    
    // Add image data
    formData.append('image_base64', base64Image);
    formData.append('image_name', file.name);
    formData.append('image_type', file.type);

    showFeedback('সার্ভারে পাঠানো হচ্ছে...', true);
    const response = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Response:', data);
    
    if (!data.ok) {
      throw new Error(data.error || 'Server responded with error');
    }

    form.reset();
    showFeedback('ফরম সফলভাবে সাবমিট হয়েছে!', true);
    successMsg.textContent = 'আপনার তথ্য এবং ছবি সেভ হয়েছে!';
    console.log('Form submitted successfully. Photo URL:', data.photoUrl);
  } catch (error) {
    console.error('Submit error:', error);
    showFeedback(`সাবমিট করতে সমস্যা হয়েছে: ${error.message}`, false);
  } finally {
    submitBtn.innerHTML = '✅ সাবমিট করুন';
    submitBtn.disabled = false;
    setTimeout(() => { successMsg.textContent = ''; }, 3000);
  }
});
