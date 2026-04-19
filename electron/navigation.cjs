const allowedExternalProtocols = new Set(['http:', 'https:', 'mailto:']);

function toUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isSameAppOrigin(targetUrl, appOrigin) {
  const target = toUrl(targetUrl);
  if (!target) return false;

  if (appOrigin.startsWith('file://')) {
    return target.protocol === 'file:';
  }

  const origin = toUrl(appOrigin)?.origin;
  return origin ? target.origin === origin : false;
}

function shouldOpenExternally(targetUrl, appOrigin) {
  const target = toUrl(targetUrl);
  if (!target) return false;
  if (isSameAppOrigin(targetUrl, appOrigin)) return false;

  return allowedExternalProtocols.has(target.protocol);
}

function handleWindowOpen(targetUrl, appOrigin, openExternal) {
  if (isSameAppOrigin(targetUrl, appOrigin)) {
    return { action: 'allow' };
  }

  if (shouldOpenExternally(targetUrl, appOrigin)) {
    openExternal(targetUrl);
  }

  return { action: 'deny' };
}

module.exports = {
  isSameAppOrigin,
  shouldOpenExternally,
  handleWindowOpen,
};
