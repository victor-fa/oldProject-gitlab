var pgTunnelCtrl = null;
var pgfnOnCallback = null;

function pgTunnelRequest(sHost, sMeth, sURI, sData, fnOnCallback)
{
	if (window.XDomainRequest) {
		return pgTunnelRequest_XDomain(sHost, sMeth, sURI, sData, fnOnCallback);
	}
	else {
		return pgTunnelRequest_Common(sHost, sMeth, sURI, sData, fnOnCallback);
	}
}

function pgTunnelRequest_Common(sHost, sMeth, sURI, sData, fnOnCallback)
{
	if (typeof(fnOnCallback) != "function") {
		alert("'fnOnCallback' must be a function");
		return false;
	}
	try {
		pgTunnelCtrl = null;
		pgTunnelCtrl = new ActiveXObject("Microsoft.XMLHTTP");
	}
	catch (e) {
		try {
		    pgTunnelCtrl = new ActiveXObject("Msxml2.XMLHTTP");
		}
		catch (e) {
			if (window.XMLHttpRequest) {
				try {
					pgTunnelCtrl = new XMLHttpRequest();
				}
				catch (e) {
					pgTunnelCtrl = null;
				}
			}
			else {
				pgTunnelCtrl = null;
			}
		}
	}
	if (!pgTunnelCtrl) {
		alert("Create XMLHttp obj failed!");
		return false;
	}
	pgfnOnCallback = fnOnCallback;
	var sURL = "";
	if (sHost != "") {
		sURL = "http://" + sHost + "/";
	}	sURL += sURI;
	pgTunnelCtrl.onreadystatechange = pgTunnelResp;
	pgTunnelCtrl.open(sMeth, sURL, true);
	pgTunnelCtrl.setRequestHeader("Content-Type", "text/json;");
	pgTunnelCtrl.setRequestHeader("Cache-Control", "no-cache");
	pgTunnelCtrl.send(sData);
	return true;
}

function pgTunnelRequest_XDomain(sHost, sMeth, sURI, sData, fnOnCallback)
{
	pgTunnelCtrl = new XDomainRequest();
	pgTunnelCtrl.onload = pgTunnelResp_XDomain;
	pgTunnelCtrl.onerror = function (e) {
	}

	pgfnOnCallback = fnOnCallback;

	var sURL = "";
	if (sHost != "") {
		sURL = "http://" + sHost + "/";
	}
	sURL += sURI;
	pgTunnelCtrl.open(sMeth, sURL);
	pgTunnelCtrl.send(sData);
	return true;
}

function pgTunnelResp()
{
	if (pgTunnelCtrl.readyState == 4) {
		if (pgfnOnCallback) {
			pgfnOnCallback(pgTunnelCtrl.status, pgTunnelCtrl.responseText);
			pgTunnelCtrl.responseText = "";
		}
	}
}

function pgTunnelResp_XDomain()
{
	if (pgfnOnCallback) {
		pgfnOnCallback(200, pgTunnelCtrl.responseText);
		pgTunnelCtrl.responseText = "";
	}
}
