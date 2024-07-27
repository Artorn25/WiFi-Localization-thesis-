const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.trackChanges = functions.database.ref('/Data').onUpdate((change, context) => {
    const beforeData = change.before.val();
    const afterData = change.after.val();
    const timestamp = Date.now();

    // บันทึกข้อมูลก่อนการเปลี่ยนแปลงไปยังโหนด History
    return admin.database().ref(`/History/${timestamp}`).set(beforeData);
});