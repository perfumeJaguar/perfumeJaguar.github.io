// Keep the archive loading UI tied to config.js instead of a hard-coded build number.
if (window.P5LabMediaManager) {
  P5LabMediaManager.prototype.setLoadingStatus = function(action, note) {
    const actionEl = document.querySelector('.start-action');
    const noteEl = document.querySelector('.start-note');
    if (actionEl) actionEl.textContent = action;
    if (noteEl) noteEl.textContent = `v${P5LAB_CONFIG.app.version} / ${note}`;
  };
}
