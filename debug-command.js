async function startBot() {
  if (!connectionState.canAttemptConnection()) {
    console.log('⏸️ Connection attempt skipped - already connecting or shutting down');
    return;
  }

  connectionState.recordConnectionAttempt();
  console.log(`🚀 Connecting to WhatsApp... (Attempt ${connectionState.connectionAttempts})`);

  try {
    const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
    
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: Browsers.windows("Chrome"),
      connectTimeoutMs: CONFIG.connection.connectTimeoutMs,
      keepAliveIntervalMs: CONFIG.connection.keepAliveIntervalMs,
      markOnlineOnConnect: false,
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
      linkPreviewImageThumbnailWidth: 192,
      maxRetries: CONFIG.connection.maxRetries,
      maxQRCodes: 3,
      qrTimeout: CONFIG.connection.qrTimeout,
      fetchOptions: { 
        axiosInstance: secureAxios, 
        timeout: CONFIG.connection.connectTimeoutMs 
      }
    });

    connectionState.currentSocket = sock;
    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      console.log(`🔗 Connection state: ${connection}`);

      if (qr) {
        qrcodeTerminal.generate(qr, { small: true });
        console.log("📱 New QR code generated");
      }

      if (connection === "open") {
        console.log("✅ Connected successfully!");
        connectionState.recordConnectionSuccess();
        
        try {
          // Load commands first with error handling
          const commandLoader = await import("./handlers/commandLoader.js");
          await commandLoader.loadCommands(sock, path.join(__dirname, "commands"));
          console.log("✅ Commands loaded successfully");
          
          // Then load message handler
          const messageHandler = await import("./handlers/messageHandler.js");
          messageHandler.handleMessages(sock);
          console.log("🎉 Bot fully initialized and ready!");
        } catch (initError) {
          console.error("❌ Failed to initialize bot components:", initError.message);
          console.log("🤖 Bot will continue running with basic functionality");
          // Don't shutdown - keep the bot running even if commands fail
        }
      }

      if (connection === "close") {
        connectionState.recordConnectionFailure();
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        
        console.log(`❌ Connection closed. Status: ${statusCode || 'unknown'}`);
        
        if (statusCode === DisconnectReason.loggedOut) {
          console.log("🔐 Logged out from server, cleaning auth...");
          fs.rmSync("./auth_info", { recursive: true, force: true });
        }

        if (!connectionState.isShuttingDown) {
          const reconnectDelay = connectionState.getReconnectDelay();
          console.log(`⏰ Reconnecting in ${reconnectDelay}ms...`);
          setTimeout(startBot, reconnectDelay);
        }
      }
    });

  } catch (error) {
    console.error("❌ Startup error:", error.message);
    connectionState.recordConnectionFailure();
    
    if (!connectionState.isShuttingDown) {
      const reconnectDelay = connectionState.getReconnectDelay();
      console.log(`⏰ Retrying after error in ${reconnectDelay}ms...`);
      setTimeout(startBot, reconnectDelay);
    }
  }
}
