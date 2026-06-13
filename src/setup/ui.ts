export function getSetupHTML(_port: number, step2Only: boolean = false): string {
  if (step2Only) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gmail MCP Server — Connect Account</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 16px;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .card {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 2px 20px rgba(0,0,0,0.08);
      max-width: 440px;
      width: 100%;
      padding: 48px 40px;
      text-align: center;
      animation: fadeIn 0.3s ease;
    }
    .header-icon { font-size: 44px; margin-bottom: 14px; }
    h1 { font-size: 24px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px; }
    .sub { font-size: 15px; color: #777; margin-bottom: 32px; }
    .info-box {
      background: #f9f9f9;
      border: 1px solid #eee;
      border-radius: 10px;
      padding: 16px 20px;
      font-size: 14px;
      color: #555;
      line-height: 1.6;
      margin-bottom: 28px;
    }
    .info-box strong { color: #1a1a1a; }
    .connect-btn {
      display: block;
      width: 100%;
      background: #EA4335;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 14px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.15s;
    }
    .connect-btn:hover { background: #c62828; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header-icon">📧</div>
    <h1>Gmail MCP Server</h1>
    <p class="sub">Connect Your Account</p>
    <div class="info-box">
      <strong>Your Google credentials are already saved.</strong><br>
      Click below to sign in with your Gmail account and authorize access.
    </div>
    <a href="/auth/start" class="connect-btn">Sign in with Gmail →</a>
  </div>
</body>
</html>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gmail MCP Server — Setup</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 48px 16px 64px;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .card {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 2px 20px rgba(0,0,0,0.08);
      max-width: 560px;
      width: 100%;
      padding: 48px 40px;
      animation: fadeIn 0.3s ease;
    }
    .header { text-align: center; margin-bottom: 40px; }
    .header-icon { font-size: 44px; margin-bottom: 14px; }
    .header h1 { font-size: 26px; font-weight: 700; color: #1a1a1a; margin-bottom: 6px; letter-spacing: -0.3px; }
    .header p { font-size: 15px; color: #777; }
    .step-heading { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
    .step-badge {
      background: #EA4335; color: #fff; border-radius: 50%;
      width: 26px; height: 26px; display: inline-flex; align-items: center;
      justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0;
    }
    .step-title { font-size: 16px; font-weight: 600; color: #1a1a1a; }
    .step1-desc { font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 16px; }
    .console-btn {
      display: inline-flex; align-items: center; gap: 6px;
      background: #EA4335; color: #fff; text-decoration: none;
      border-radius: 8px; padding: 10px 18px; font-size: 14px; font-weight: 500;
      margin-bottom: 20px; transition: background 0.15s;
    }
    .console-btn:hover { background: #c62828; }
    .instructions { font-size: 14px; color: #555; display: flex; flex-direction: column; gap: 8px; }
    .instruction-row { display: flex; align-items: flex-start; gap: 10px; }
    .circle-num {
      flex-shrink: 0; width: 22px; height: 22px; background: #f0f0f0;
      border-radius: 50%; display: inline-flex; align-items: center;
      justify-content: center; font-size: 11px; font-weight: 700; color: #444; margin-top: 1px;
    }
    .instruction-text { line-height: 1.5; }
    .instruction-text strong { color: #1a1a1a; }
    .divider { height: 1px; background: #eee; margin: 32px 0; }
    .form-group { margin-bottom: 18px; }
    label { display: block; font-size: 13px; font-weight: 600; color: #333; margin-bottom: 7px; }
    input[type="text"], input[type="password"] {
      width: 100%; border: 1.5px solid #ddd; border-radius: 8px;
      padding: 11px 14px; font-size: 14px; color: #1a1a1a; outline: none;
      transition: border-color 0.15s, box-shadow 0.15s; background: #fafafa;
    }
    input:focus { border-color: #EA4335; box-shadow: 0 0 0 3px rgba(234,67,53,0.12); background: #fff; }
    .submit-btn {
      width: 100%; background: #EA4335; color: #fff; border: none;
      border-radius: 8px; padding: 13px; font-size: 15px; font-weight: 600;
      cursor: pointer; transition: background 0.15s, opacity 0.15s; margin-top: 4px;
    }
    .submit-btn:hover:not(:disabled) { background: #c62828; }
    .submit-btn:disabled { opacity: 0.55; cursor: default; }
    .status { display: none; text-align: center; padding: 12px 16px; border-radius: 8px; font-size: 14px; margin-top: 14px; line-height: 1.5; }
    .status.loading { display: block; background: #e8f0fe; color: #1a56db; }
    .status.error   { display: block; background: #fef2f2; color: #b91c1c; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="header-icon">📧</div>
      <h1>Gmail MCP Server</h1>
      <p>First Time Setup</p>
    </div>

    <div>
      <div class="step-heading">
        <span class="step-badge">1</span>
        <span class="step-title">Get Your Google Credentials</span>
      </div>
      <p class="step1-desc">
        You need a free Google Cloud OAuth credential.<br>
        This takes about 2 minutes and is completely free.
      </p>
      <a href="https://console.cloud.google.com/apis/credentials" target="_blank" class="console-btn">
        Open Google Cloud Console &#x2197;
      </a>
      <div class="instructions">
        <div class="instruction-row">
          <span class="circle-num">&#9312;</span>
          <span class="instruction-text">Go to <strong>APIs &amp; Services &#x2192; Library</strong> &#x2192; search <em>"Gmail API"</em> &#x2192; Enable</span>
        </div>
        <div class="instruction-row">
          <span class="circle-num">&#9313;</span>
          <span class="instruction-text">Go to <strong>APIs &amp; Services &#x2192; Credentials</strong> &#x2192; <strong>+ Create Credentials &#x2192; OAuth 2.0 Client ID</strong></span>
        </div>
        <div class="instruction-row">
          <span class="circle-num">&#9314;</span>
          <span class="instruction-text">If asked to configure consent screen: choose <strong>External</strong>, fill in your email, save</span>
        </div>
        <div class="instruction-row">
          <span class="circle-num">&#9315;</span>
          <span class="instruction-text">Application type: <strong>Desktop App</strong> &#x2192; Name: <strong>Gmail MCP</strong> &#x2192; Create</span>
        </div>
        <div class="instruction-row">
          <span class="circle-num">&#9316;</span>
          <span class="instruction-text">Copy the <strong>Client ID</strong> and <strong>Client Secret</strong> shown in the popup</span>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <div>
      <div class="step-heading">
        <span class="step-badge">2</span>
        <span class="step-title">Enter Your Credentials</span>
      </div>
      <form id="setupForm">
        <div class="form-group">
          <label for="clientId">Client ID</label>
          <input type="text" id="clientId" name="clientId"
            placeholder="743xxxxx-xxxx.apps.googleusercontent.com" autocomplete="off" required />
        </div>
        <div class="form-group">
          <label for="clientSecret">Client Secret</label>
          <input type="password" id="clientSecret" name="clientSecret"
            placeholder="GOCSPX-xxxxxxxxxxxxxxxxxx" autocomplete="off" required />
        </div>
        <button type="submit" class="submit-btn" id="submitBtn">Connect Gmail &#x2192;</button>
        <div class="status" id="status"></div>
      </form>
    </div>
  </div>

  <script>
    document.getElementById('setupForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      var clientId = document.getElementById('clientId').value.trim();
      var clientSecret = document.getElementById('clientSecret').value.trim();
      var btn = document.getElementById('submitBtn');
      var status = document.getElementById('status');

      if (!clientId || !clientSecret) {
        status.className = 'status error';
        status.textContent = 'Both fields are required.';
        return;
      }

      btn.disabled = true;
      status.className = 'status loading';
      status.textContent = 'Saving credentials...';

      try {
        var res = await fetch('/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: clientId, clientSecret: clientSecret })
        });
        var data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to save credentials');
        status.textContent = 'Opening Google sign-in...';
        window.location.href = '/auth/start';
      } catch (err) {
        status.className = 'status error';
        status.textContent = err.message || 'Something went wrong. Please try again.';
        btn.disabled = false;
      }
    });
  </script>
</body>
</html>`;
}

export function getDashboardHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gmail MCP Server</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 48px 16px 64px;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes bannerSlide { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
    .card {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 2px 20px rgba(0,0,0,0.08);
      max-width: 600px;
      width: 100%;
      padding: 40px;
      animation: fadeIn 0.3s ease;
    }
    /* Header */
    .header {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 28px;
      padding-bottom: 24px;
      border-bottom: 1px solid #f0f0f0;
    }
    .header-icon { font-size: 36px; flex-shrink: 0; }
    .header-title { font-size: 20px; font-weight: 700; color: #1a1a1a; }
    .header-sub { font-size: 13px; color: #888; margin-top: 2px; }
    /* Success banner */
    .success-banner {
      display: none;
      background: #ecfdf5;
      border: 1px solid #6ee7b7;
      color: #065f46;
      border-radius: 10px;
      padding: 12px 16px;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 24px;
      animation: bannerSlide 0.3s ease;
      transition: opacity 0.5s ease;
    }
    /* Section label */
    .section-label {
      font-size: 11px;
      font-weight: 700;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 10px;
    }
    /* Account cards */
    .accounts-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
    .account-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #fafafa;
      border: 1px solid #ebebeb;
      border-radius: 10px;
      padding: 13px 16px;
      gap: 12px;
      transition: box-shadow 0.15s;
    }
    .account-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.07); }
    .account-left { display: flex; align-items: center; gap: 11px; min-width: 0; }
    .status-dot { font-size: 11px; flex-shrink: 0; }
    .account-email { font-size: 14px; font-weight: 600; color: #1a1a1a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .account-meta { font-size: 12px; color: #999; margin-top: 2px; }
    .account-actions { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }
    .reconnect-btn {
      background: none; border: 1px solid #f59e0b; color: #b45309;
      border-radius: 6px; padding: 5px 10px; font-size: 12px; font-weight: 500;
      cursor: pointer; white-space: nowrap; transition: background 0.15s;
    }
    .reconnect-btn:hover { background: #fef3c7; }
    .remove-btn {
      background: none; border: 1px solid #ddd; color: #777;
      border-radius: 6px; padding: 5px 10px; font-size: 12px; font-weight: 500;
      cursor: pointer; white-space: nowrap; transition: all 0.15s;
    }
    .remove-btn:hover { border-color: #EA4335; color: #EA4335; background: #fef2f2; }
    .no-accounts { color: #999; font-size: 14px; text-align: center; padding: 24px 0; }
    /* Add account button */
    .add-btn {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      width: 100%; background: none; border: 1.5px dashed #ddd; border-radius: 10px;
      padding: 12px; font-size: 14px; color: #666; cursor: pointer;
      transition: all 0.15s; font-weight: 500; margin-bottom: 32px;
      text-decoration: none;
    }
    .add-btn:hover { border-color: #EA4335; color: #EA4335; background: #fef2f2; }
    .divider { height: 1px; background: #f0f0f0; margin: 28px 0; }
    /* Config block */
    .config-wrapper { position: relative; background: #1e1e1e; border-radius: 10px; overflow: hidden; }
    .config-block {
      margin: 0;
      padding: 20px 20px 20px 20px;
      color: #d4d4d4;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.65;
      overflow-x: auto;
      white-space: pre;
    }
    .copy-btn {
      position: absolute; top: 10px; right: 10px;
      background: rgba(255,255,255,0.1); color: #ccc;
      border: 1px solid rgba(255,255,255,0.15); border-radius: 6px;
      padding: 5px 12px; font-size: 12px; cursor: pointer;
      font-family: inherit; transition: background 0.15s; z-index: 1;
    }
    .copy-btn:hover { background: rgba(255,255,255,0.2); }
    .copy-btn.copied { background: rgba(46,125,50,0.4); border-color: rgba(46,125,50,0.6); color: #a5d6a7; }
    .loading-msg { color: #bbb; font-size: 14px; text-align: center; padding: 20px 0; }
    /* Responsive */
    @media (max-width: 480px) {
      .card { padding: 28px 20px; }
      .account-card { flex-direction: column; align-items: flex-start; }
      .account-actions { width: 100%; justify-content: flex-end; }
    }
  </style>
</head>
<body>
  <div class="card">

    <div class="header">
      <div class="header-icon">&#128247;</div>
      <div>
        <div class="header-title">Gmail MCP Server</div>
        <div class="header-sub">Manage your connected accounts</div>
      </div>
    </div>

    <div id="successBanner" class="success-banner"></div>

    <div class="section-label">Connected Accounts</div>
    <div class="accounts-list" id="accountsList">
      <div class="loading-msg">Loading...</div>
    </div>

    <a href="/auth/start" class="add-btn" id="addBtn">
      + Add Another Gmail Account
    </a>

    <div class="divider"></div>

    <div class="section-label">Claude Desktop Config</div>
    <div class="config-wrapper">
      <button class="copy-btn" id="copyBtn" onclick="copyConfig()">Copy</button>
      <pre class="config-block" id="configBlock">Loading...</pre>
    </div>

  </div>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      var params = new URLSearchParams(window.location.search);
      var connected = params.get('connected');
      if (connected) {
        showSuccessBanner(connected);
        history.replaceState({}, '', '/');
      }
      loadData();
    });

    function escHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    async function loadData() {
      try {
        var res = await fetch('/config');
        var data = await res.json();
        renderAccounts(data.accounts || []);
        renderConfig(data.accounts || []);
      } catch (err) {
        document.getElementById('accountsList').innerHTML =
          '<div class="no-accounts">Failed to load accounts.</div>';
        document.getElementById('configBlock').textContent = '(error loading config)';
      }
    }

    function renderAccounts(accounts) {
      var list = document.getElementById('accountsList');
      if (!accounts.length) {
        list.innerHTML = '<div class="no-accounts">No accounts connected yet.</div>';
        return;
      }
      var html = '';
      for (var i = 0; i < accounts.length; i++) {
        var a = accounts[i];
        var isExpired = a.tokenExpiry && a.tokenExpiry < Date.now();
        var dot = isExpired ? '&#x1F7E1;' : '&#x1F7E2;';
        var status = isExpired ? 'Token may need refresh' : 'Connected';
        var date = new Date(a.addedAt).toLocaleDateString('en-US', {
          month: 'long', day: 'numeric', year: 'numeric'
        });
        var safeEmail = escHtml(a.email);
        html += '<div class="account-card">';
        html += '<div class="account-left">';
        html += '<span class="status-dot">' + dot + '</span>';
        html += '<div>';
        html += '<div class="account-email">' + safeEmail + '</div>';
        html += '<div class="account-meta">' + status + ' &middot; Added ' + date + '</div>';
        html += '</div></div>';
        html += '<div class="account-actions">';
        if (isExpired) {
          html += '<button class="reconnect-btn" onclick="window.location.href=\'/auth/start\'">Re-connect</button>';
        }
        html += '<button class="remove-btn" data-email="' + safeEmail + '" onclick="removeAccount(this.dataset.email)">Remove</button>';
        html += '</div></div>';
      }
      list.innerHTML = html;
    }

    function renderConfig(accounts) {
      var config;
      if (accounts.length <= 1) {
        config = {
          mcpServers: {
            gmail: { command: 'npx', args: ['-y', 'gmail-mcp-server'] }
          }
        };
      } else {
        config = { mcpServers: {} };
        for (var i = 0; i < accounts.length; i++) {
          var key = 'gmail-' + accounts[i].email.split('@')[0];
          config.mcpServers[key] = {
            command: 'npx',
            args: ['-y', 'gmail-mcp-server'],
            env: { GMAIL_ACCOUNT: accounts[i].email }
          };
        }
      }
      document.getElementById('configBlock').textContent = JSON.stringify(config, null, 2);
    }

    async function removeAccount(email) {
      if (!confirm('Remove ' + email + '? This cannot be undone.')) return;
      try {
        var res = await fetch('/accounts/' + encodeURIComponent(email), { method: 'DELETE' });
        var data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to remove account');
        var cfgRes = await fetch('/config');
        var cfgData = await cfgRes.json();
        if (!cfgData.accounts || cfgData.accounts.length === 0) {
          window.location.reload();
        } else {
          renderAccounts(cfgData.accounts);
          renderConfig(cfgData.accounts);
        }
      } catch (err) {
        alert('Failed to remove account: ' + err.message);
      }
    }

    async function copyConfig() {
      var text = document.getElementById('configBlock').textContent;
      var btn = document.getElementById('copyBtn');
      try {
        await navigator.clipboard.writeText(text);
      } catch (_) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(function() {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 2000);
    }

    function showSuccessBanner(email) {
      var banner = document.getElementById('successBanner');
      banner.textContent = '&#x2705; ' + email + ' connected successfully!';
      banner.innerHTML = '&#x2705; ' + escHtml(email) + ' connected successfully!';
      banner.style.display = 'block';
      setTimeout(function() {
        banner.style.opacity = '0';
        setTimeout(function() { banner.style.display = 'none'; }, 500);
      }, 3000);
    }
  </script>
</body>
</html>`;
}
