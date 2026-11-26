# Testing Instructions — Multi-User Login

## Agar logout/login ke baad bhi purana user dikhta hai:

### Method 1: Browser DevTools se Cookie Clear (Recommended)
1. Browser DevTools kholo (F12)
2. **Application** tab → **Cookies** → `http://localhost:3000`
3. `tbms_session` cookie ko **delete** karo (right-click → Delete)
4. `localStorage` → `tbms_user` ko bhi delete karo
5. Page refresh karo (Ctrl+R)

### Method 2: Incognito/Private Window
- Naya Incognito window kholo
- `http://localhost:3000/login` pe jao
- Different user se login karo

### Method 3: Hard Refresh
1. Logout button dabao
2. Phir **Ctrl+Shift+R** (Windows) ya **Cmd+Shift+R** (Mac) dabao — hard refresh
3. Login page khulega, naye user se login karo

---

## Test Users (default):
```
Admin:
  Username: admin
  Password: admin@123

Custom users (jo aapne banaye):
  Username: sarfraz, rajesh, etc.
  Password: jo admin ne set kiya
```

---

## Expected Behavior:

| User Role | Visible Menu Items |
|-----------|-------------------|
| **Employee** | Dashboard, Submit Claim, My Claims |
| **Manager** | Dashboard, Submit Claim, My Claims, Manager Approval, Reports |
| **Finance** | Dashboard, Submit Claim, My Claims, Finance Approval, Payout, Reports |
| **Admin** | Dashboard, Submit Claim, My Claims (All Claims), Manager Approval, Finance Approval, Payout, Reports, **User Management** |

---

## Debug Check:
Browser console mein yeh command run karo:
```js
console.log(document.cookie)
console.log(localStorage.getItem('tbms_user'))
```

Dono mein **same user** dikhna chahiye jo login hai.
