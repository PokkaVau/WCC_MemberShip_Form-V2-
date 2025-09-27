// ===== refs =====
const form = document.getElementById('wccForm');
const feedback = document.getElementById('form-feedback');
const successMsg = document.getElementById('successMsg');
const submitBtn = document.getElementById('submitBtn');

// GAS Web App URL (update this)
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz9tq09WjmnpVRQGgC3WDRhNv3mWR9vZ9i4cGLIqnkDOZ7CYHlYUaFYBGHPKHfK_64a/exec';

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
      const base64 = reader.result.split(',')[1];
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


  submitBtn.innerHTML = '⏳ প্রসেসিং হচ্ছে... কিছুক্ষণ অপেক্ষা করুন';
  submitBtn.disabled = true;

  try {
    showFeedback('ছবি প্রস্তুত করা হচ্ছে... কিছুক্ষণ অপেক্ষা করুন', true);
    const base64Image = await fileToBase64(file);

    const formData = new FormData();
    [...form.elements].forEach(el => {
      if (el.name && el.name !== 'photo' && el.value) {
        formData.append(el.name, el.value);
      }
    });

    formData.append('image_base64', base64Image);
    formData.append('image_name', file.name);
    formData.append('image_type', file.type);

    showFeedback('সার্ভারে পাঠানো হচ্ছে... কিছুক্ষণ অপেক্ষা করুন', true);
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
