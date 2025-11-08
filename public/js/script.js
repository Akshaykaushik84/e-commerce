// // Get DOM elements
// const loginTab = document.getElementById('login');
// const signTab = document.getElementById('sign');
// const loginPage = document.getElementById('loginpage');
// const signupPage = document.getElementById('signup');

// let loginValue = "User"; // Default login type

// const signupform = document.getElementById('signupForm');
// const loginform = document.getElementById('loginForm');

// // Switch to Login Tab
// loginTab.addEventListener('click', () => {
//   document.getElementById('username').value = '';
//   document.getElementById('password').value = '';
//   loginPage.style.display = 'block';
//   signupPage.style.display = 'none';
// });

// // Switch to Signup Tab
// signTab.addEventListener('click', () => {
//   loginPage.style.display = 'none';
//   signupPage.style.display = 'block';
// });

// // Signup form submission
// signupform.addEventListener('submit', function (e) {
//   e.preventDefault();

//   const username = document.getElementById('newUsername').value.trim();
//   const email = document.getElementById('email').value.trim();
//   const password = document.getElementById('newPassword').value.trim();
//   const checkbox = document.getElementById('admin');

//   loginValue = checkbox && checkbox.checked ? "Admin" : "User";

//   if (username === '' || email === '' || password === '') {
//     alert('Please fill out the form');
//   } else {
//     const send = {
//       name: username,
//       password: password,
//       email: email,
//       loginvalue: loginValue
//     };

//     const xml = new XMLHttpRequest();
//     xml.open("POST", "http://localhost:3000/signup");
//     xml.setRequestHeader("Content-Type", "application/json");
//     xml.send(JSON.stringify(send));

//     xml.onload = () => {
//   const res = JSON.parse(xml.responseText);
//   if (xml.status === 200) {
//     alert(res.message || "Registration successful!");
//   } else {
//     alert(res.message || "Registration Failed");
//   }
// };
//   }

//   // Reset form and switch to login tab
//   document.getElementById('signupForm').reset();
//   loginTab.click();
// });

// // Login form submission
// loginform.addEventListener('submit', function (e) {
//   e.preventDefault();

//   const usernameInput = document.getElementById('username');
//   const passwordInput = document.getElementById('password');
//   const username = usernameInput.value.trim();
//   const password = passwordInput.value.trim();

//   if (username === '' || password === '') {
//     alert("Please fill the form");
//   } else {
//     const sendlogin = {
//       name: username,
//       pass: password,
//       loginValue: loginValue
//     };

//     const xml = new XMLHttpRequest();
//     xml.open("POST", "http://localhost:3000/login");
//     xml.setRequestHeader("Content-Type", "application/json");
//     xml.send(JSON.stringify(sendlogin));

//     xml.onload = () => {
//   if (xml.status === 200) {
//     try {
//       const val = JSON.parse(xml.responseText);
//       localStorage.setItem('user', username);
//       alert(val.message);
//       if (val.redirect) {
//         window.location.href = val.redirect;
//       }
//     } catch (err) {
//       console.error("Invalid JSON response", err);
//       alert("Login Failed");
//     }
//   } else {
//     alert("Login Failed");
//   }
// };

//   }

//   // Clear inputs after submission
//   usernameInput.value = '';
//   passwordInput.value = '';
// });


// version 2---------------------------------------------------------


// ===== Get DOM elements =====
const loginTab = document.getElementById('login');
const signTab = document.getElementById('sign');
const loginPage = document.getElementById('loginpage');
const signupPage = document.getElementById('signup');

let loginValue = "User"; // Default login type

const signupform = document.getElementById('signupForm');
const loginform = document.getElementById('loginForm');
const sendOtpBtn = document.getElementById('send-otp');
const otpInput = document.getElementById('otp');
const signupBtn = document.getElementById('signup-btn');

// ===== Switch Tabs =====
loginTab.addEventListener('click', () => {
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  loginPage.style.display = 'block';
  signupPage.style.display = 'none';
});

signTab.addEventListener('click', () => {
  loginPage.style.display = 'none';
  signupPage.style.display = 'block';
});

// ===== Send OTP =====
sendOtpBtn.addEventListener('click', () => {
  const email = document.getElementById('email').value.trim();
  if (!email) {
    swal("Please enter your email first.");
    return;
  }

  // Send OTP request
  const xml = new XMLHttpRequest();
  xml.open("POST", "http://localhost:3000/send-otp");
  xml.setRequestHeader("Content-Type", "application/json");
  xml.send(JSON.stringify({ email }));

  xml.onload = () => {
    if (xml.status === 200) {
      swal("OTP sent to your email.", "...Please Enter Otp");
      otpInput.style.display = "block";
      signupBtn.disabled = false;
    } else {
      swal("Failed to send OTP.");
    }
  };
});

// ===== Signup with OTP verification =====
signupform.addEventListener('submit', function (e) {
  e.preventDefault();

  const username = document.getElementById('newUsername').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('newPassword').value.trim();
  const otp = document.getElementById('otp').value.trim();
  const checkbox = document.getElementById('admin');

  loginValue = checkbox && checkbox.checked ? "Admin" : "User";

  if (!username || !email || !password || !otp) {
    swal('Please fill out all fields and enter OTP.');
    return;
  }

  // Final signup with OTP
  const signupData = {
    name: username,
    email: email,
    password: password,
    loginvalue: loginValue,
    otp: otp
  };

  const xml2 = new XMLHttpRequest();
  xml2.open("POST", "http://localhost:3000/signup");
  xml2.setRequestHeader("Content-Type", "application/json");
  xml2.send(JSON.stringify(signupData));

  xml2.onload = () => {
    const res = JSON.parse(xml2.responseText);
    if (xml2.status === 200) {
      swal("Good job!", res.message, "success");
      document.getElementById('signupForm').reset();
      otpInput.style.display = "none";
      signupBtn.disabled = true;
      loginTab.click();
    } else {
      swal(res.message);

      // If OTP invalid, generate new OTP automatically
      const xml3 = new XMLHttpRequest();
      xml3.open("POST", "http://localhost:3000/send-otp");
      xml3.setRequestHeader("Content-Type", "application/json");
      xml3.send(JSON.stringify({ email }));

      xml3.onload = () => {
        if (xml3.status === 200) {
          swal("New OTP sent to your email.", "...Please Enter Otp");
        } else {
          swal("Failed to resend OTP.");
        }
      };
    }
  };
});

// ===== Login form submission =====
loginform.addEventListener('submit', function (e) {
  e.preventDefault();

  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    swal("Please fill the form");
    return;
  }

  const sendlogin = {
    name: username,
    pass: password,
    loginValue: loginValue
  };

  const xml = new XMLHttpRequest();
  xml.open("POST", "http://localhost:3000/login");
  xml.setRequestHeader("Content-Type", "application/json");
  xml.send(JSON.stringify(sendlogin));

  xml.onload = () => {
    if (xml.status === 200) {
      try {
        const val = JSON.parse(xml.responseText);
        localStorage.setItem('user', username);
        swal("Good job!", val.message, "success");
        if (val.redirect) {
          window.location.href = val.redirect;
        }
      } catch (err) {
        console.error("Invalid JSON response", err);
        swal("Login Failed");
      }
    } else {
      swal("Login Failed");
    }
  };
  usernameInput.value = '';
  passwordInput.value = '';
});
