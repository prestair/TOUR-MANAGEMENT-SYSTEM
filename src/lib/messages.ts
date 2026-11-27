// Bilingual messages — English + Hindi in Devanagari
// Format: { en: "English", hi: "हिंदी" }

export const M = {
  // ── Login ──────────────────────────────────────────────────
  loginUserNotFound:   { en: 'Username not found. Please contact admin.',         hi: 'उपयोगकर्ता नाम नहीं मिला। कृपया व्यवस्थापक से संपर्क करें।' },
  loginInactive:       { en: 'Your account is inactive. Please contact admin.',   hi: 'आपका खाता निष्क्रिय है। कृपया व्यवस्थापक से संपर्क करें।' },
  loginWrongPassword:  { en: 'Incorrect password. Please try again.',             hi: 'गलत पासवर्ड। कृपया पुनः प्रयास करें।' },
  loginServerError:    { en: 'Server error. Please try again.',                   hi: 'सर्वर में त्रुटि। कृपया पुनः प्रयास करें।' },

  // ── Claim ──────────────────────────────────────────────────
  claimSubmitSuccess:  { en: 'Claim submitted successfully!',                     hi: 'दावा सफलतापूर्वक जमा हो गया!' },
  claimSubmitFail:     { en: 'Failed to submit claim. Please try again.',          hi: 'दावा जमा करने में विफल। कृपया पुनः प्रयास करें।' },
  claimDeleteSuccess:  { en: 'Claim deleted successfully.',                        hi: 'दावा सफलतापूर्वक हटा दिया गया।' },
  claimDeleteFail:     { en: 'Failed to delete claim.',                            hi: 'दावा हटाने में विफल।' },
  claimUpdateSuccess:  { en: 'Claim updated and resubmitted!',                    hi: 'दावा अपडेट करके पुनः जमा कर दिया गया!' },
  claimUpdateFail:     { en: 'Failed to update claim.',                            hi: 'दावा अपडेट करने में विफल।' },
  claimNoDoc:          { en: 'Please attach at least one document.',               hi: 'कृपया कम से कम एक दस्तावेज़ संलग्न करें।' },
  claimNotLoggedIn:    { en: 'You are not logged in.',                             hi: 'आप लॉग इन नहीं हैं।' },
  claimNoAttachment:   { en: 'No documents attached to this claim.',               hi: 'इस दावे में कोई दस्तावेज़ नहीं है।' },

  // ── Manager Actions ────────────────────────────────────────
  claimApproved:       (amt: number) => ({
    en: `Claim approved for ₹${amt.toLocaleString('en-IN')}.`,
    hi: `₹${amt.toLocaleString('en-IN')} के लिए दावा स्वीकृत कर दिया गया।`,
  }),
  claimRejected:       { en: 'Claim rejected.',                                   hi: 'दावा अस्वीकार कर दिया गया।' },
  claimOnHold:         { en: 'Claim put on hold.',                                hi: 'दावा रोक दिया गया।' },
  approveAmtRequired:  { en: 'Please enter the approve amount first.',            hi: 'पहले स्वीकृत राशि दर्ज करें।' },

  // ── Finance ────────────────────────────────────────────────
  financeApproved:     { en: 'Finance approval granted.',                         hi: 'वित्त द्वारा अनुमोदन दे दिया गया।' },
  financeRejected:     { en: 'Claim rejected by finance.',                        hi: 'वित्त द्वारा दावा अस्वीकार कर दिया गया।' },
  markedPaid:          { en: 'Payment marked as complete!',                       hi: 'भुगतान पूर्ण के रूप में चिह्नित कर दिया गया!' },

  // ── User Management ────────────────────────────────────────
  userCreated:         { en: 'User created successfully!',                        hi: 'उपयोगकर्ता सफलतापूर्वक बना दिया गया!' },
  userUpdated:         { en: 'User updated successfully.',                        hi: 'उपयोगकर्ता सफलतापूर्वक अपडेट कर दिया गया।' },
  userDeleted:         { en: 'User deleted successfully.',                        hi: 'उपयोगकर्ता सफलतापूर्वक हटा दिया गया।' },
  userDeleteFail:      { en: 'Failed to delete user.',                            hi: 'उपयोगकर्ता हटाने में विफल।' },
  userActivated:       { en: 'User activated successfully.',                      hi: 'उपयोगकर्ता सफलतापूर्वक सक्रिय कर दिया गया।' },
  userDeactivated:     { en: 'User deactivated. Login has been disabled.',        hi: 'उपयोगकर्ता निष्क्रिय कर दिया गया। लॉग इन बंद कर दिया गया है।' },
  userToggleFail:      { en: 'Failed to update user status.',                     hi: 'उपयोगकर्ता की स्थिति अपडेट करने में विफल।' },
  usernameRequired:    { en: 'Username is required.',                             hi: 'उपयोगकर्ता नाम आवश्यक है।' },
  passwordRequired:    { en: 'Password is required.',                             hi: 'पासवर्ड आवश्यक है।' },
  passwordTooShort:    { en: 'Password must be at least 4 characters.',           hi: 'पासवर्ड कम से कम 4 अक्षर का होना चाहिए।' },
  usernameExists:      { en: 'This username already exists.',                     hi: 'यह उपयोगकर्ता नाम पहले से मौजूद है।' },
  usernameExistsOther: { en: 'This username belongs to another user.',            hi: 'यह उपयोगकर्ता नाम किसी और का है।' },
  passwordMismatch:    { en: 'Passwords do not match.',                           hi: 'पासवर्ड मेल नहीं खाते।' },
  passwordUpdated:     { en: 'Password updated successfully.',                    hi: 'पासवर्ड सफलतापूर्वक अपडेट कर दिया गया।' },
}

// Helper — format as "English (हिंदी)"
export function fmt(m: { en: string; hi: string }): string {
  return `${m.en} (${m.hi})`
}
