# D’EXECUTIVE Admin and VIP Access

## What will be built
- Rename all visible OGODDS branding and page metadata to D’EXECUTIVE while keeping the supplied logo fitted in the navigation.
- Add customer registration and sign-in using a mobile number and password, with name and mobile money number saved to the customer profile.
- Add a GH₵50 payment-confirmation form where customers submit the mobile money name and transaction reference after paying.
- Add a protected admin portal where the administrator can:
  - review pending payment confirmations;
  - approve or reject payments;
  - upload a football prediction image and enter its BET code;
  - publish or remove VIP predictions.
- Add a protected VIP page. Only customers whose payment has been approved can see the uploaded prediction image and BET code.
- Show clear pending, approved, rejected, empty, loading, and error states.

## Access and security
- Create the first administrator securely from the supplied phone number and password; the password will not be placed in site code.
- Store administrator privileges in a separate roles table and enforce them in the database.
- Protect customer profiles, payment confirmations, prediction records, and uploaded pictures with access rules.
- Validate names, Ghana mobile numbers, transaction references, BET codes, and image uploads.

## Technical details
- Use Lovable Cloud for accounts, database records, and private image storage.
- Use a synthetic internal email derived from each normalized mobile number because the account system requires an email identifier; customers continue to see and use only their phone number.
- Payment confirmation is manual: submitting details creates a pending request, and admin approval grants VIP access.
- Add routes for customer access, VIP content, and the admin portal, with redirects based on sign-in and access status.

## Verification
- Check customer registration/sign-in, payment submission, admin approval, prediction upload, VIP visibility, unauthorized access blocking, and desktop/mobile layouts.
