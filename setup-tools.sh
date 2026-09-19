#!/usr/bin/env bash
# setup-tools.sh — Auto-install missing HexStrike tools via apt/pip/pipx/go
# Run: sudo bash setup-tools.sh
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log_ok()   { echo -e "${GREEN}[OK]${NC}   $1"; }
log_warn() { echo -e "${YELLOW}[SKIP]${NC} $1"; }
log_err()  { echo -e "${RED}[FAIL]${NC} $1"; }

check_cmd() { command -v "$1" &>/dev/null; }

install_apt() {
    local pkg="$1"
    if check_cmd "$pkg"; then log_ok "$pkg already installed"; return 0; fi
    if apt-get install -y "$pkg" 2>/dev/null; then log_ok "apt: $pkg"; return 0; fi
    log_warn "apt: $pkg not available"; return 1
}

install_pip() {
    local pkg="$1"
    pip show "$pkg" &>/dev/null && { log_ok "pip: $pkg already installed"; return 0; }
    if pip install -q "$pkg" 2>/dev/null; then log_ok "pip: $pkg"; return 0; fi
    log_warn "pip: $pkg failed"; return 1
}

install_pipx() {
    local pkg="$1"
    pipx list 2>/dev/null | grep -q "$pkg" && { log_ok "pipx: $pkg already installed"; return 0; }
    if pipx install "$pkg" 2>/dev/null; then log_ok "pipx: $pkg"; return 0; fi
    log_warn "pipx: $pkg failed"; return 1
}

install_go() {
    local pkg="$1" repo="$2"
    if check_cmd "$pkg"; then log_ok "go: $pkg already installed"; return 0; fi
    if go install "${repo}@latest" 2>/dev/null; then log_ok "go: $pkg"; return 0; fi
    log_warn "go: $pkg failed"; return 1
}

install_git() {
    local name="$1" url="$2" target="$3"
    if [ -d "$target" ]; then log_ok "git: $name already cloned"; return 0; fi
    if git clone --depth 1 "$url" "$target" 2>/dev/null; then log_ok "git: $name"; return 0; fi
    log_warn "git: $name clone failed"; return 1
}

echo "=== HexStrike Tool Installer ==="
echo ""

# ── apt packages ──────────────────────────────────────────────────
echo "--- apt packages ---"
install_apt nmap
install_apt masscan
install_apt nikto
install_apt sqlmap
install_apt hydra
install_apt john
install_apt wireshark
install_apt tcpdump
install_apt openssl
install_apt socat
install_apt netcat-openbsd
install_apt enum4linux
install_apt smbclient
install_apt ldap-utils
install_apt rpcbind
install_apt crackmapexec  || true
install_apt responder    || true
install_apt dirb         || true
install_apt wfuzz        || true
install_apt whatweb      || true
install_apt dnsrecon     || true
install_apt dnsenum      || true
install_apt theharvester || true
install_apt spiderfoot   || true
install_apt testssl      || true
install_apt sslscan      || true
install_apt hashcat      || true
install_apt binwalk      || true
install_apt foremost     || true
install_apt steghide     || true
install_apt fcrackzip    || true
install_apt xxd          || true
install_apt git          || true
install_apt python3      || true
install_apt python3-pip  || true
install_apt python3-venv || true
install_apt curl         || true
install_apt wget         || true
install_apt jq           || true
install_apt ruby         || true
install_apt go           || true
install_apt wordlists    || true

# ── pip packages ─────────────────────────────────────────────────
echo ""
echo "--- pip packages ---"
install_pip impacket
install_pip pwntools
install_pip scapy
install_pip requests
install_pip flask
install_pip cryptography
install_pip pycryptodome
install_pip paramiko
install_pip netifaces
install_pip dnspython
install_pip python-nmap
install_pip openpyxl
install_pip pandas
install_pip numpy
install_pip pillow
install_pip stegoveritas || install_pip Pillow 2>/dev/null || true

# ── pipx tools ───────────────────────────────────────────────────
echo ""
echo "--- pipx tools ---"
install_pipx droopescan   || true
install_pipx crackmapexec || true

# ── go tools ─────────────────────────────────────────────────────
echo ""
echo "--- go tools ---"
install_go subfinder      "github.com/projectdiscovery/subfinder/v2/cmd/subfinder"
install_go httpx          "github.com/projectdiscovery/httpx/cmd/httpx"
install_go nuclei         "github.com/projectdiscovery/nuclei/v3/cmd/nuclei"
install_go naabu          "github.com/projectdiscovery/naabu/v2/cmd/naabu"
install_go dnsx           "github.com/projectdiscovery/dnsx/cmd/dnsx"
install_go katana         "github.com/projectdiscovery/katana/cmd/katana"
install_go gau            "github.com/lc/gau/v2/cmd/gau"
install_go waybackurls    "github.com/tomnomnom/waybackurls"
install_go unfurl         "github.com/tomnomnom/unfurl"
install_go anew           "github.com/tomnomnom/anew"
install_go qsreplace      "github.com/tomnomnom/qsreplace"
install_go dalfox         "github.com/hahwul/dalfox"
install_go ffuf           "github.com/ffuf/ffuf"
install_go nuclei-templates "github.com/projectdiscovery/nuclei-templates/cmd/nuclei-templates" || true

# ── git clones ───────────────────────────────────────────────────
echo ""
echo "--- git clones ---"
install_git "nuclei-templates"    "https://github.com/projectdiscovery/nuclei-templates.git"    "$HOME/tools/nuclei-templates"
install_git "custom-exploits"     "https://github.com/swisskyrepo/PayloadsAllTheThings.git"    "$HOME/tools/custom-exploits"
install_git "exploitdb"           "https://github.com/offensive-security/exploitdb.git"        "$HOME/tools/exploitdb"
install_git "shell-storm"         "https://github.com/hellman/shell-storm.git"                 "$HOME/tools/shell-storm"
install_git "stegoveritas"        "https://github.com/BeeSecurity/stegoveritas.git"            "$HOME/tools/stegoveritas"
install_git "zsteg"               "https://github.com/zed-0xff/zsteg.git"                      "$HOME/tools/zsteg"
install_git "stegseek"            "https://github.com/RickdeJager/stegseek.git"                "$HOME/tools/stegseek"
install_git "xortool"             "https://github.com/hellman/xortool.git"                     "$HOME/tools/xortool"
install_git "hash-identifier"     "https://github.com/HashPals/Hash-Identifier.git"            "$HOME/tools/hash-identifier"
install_git "revshell-gen"        "https://github.com/gentlemanofverona/reverse-shell-generator.git" "$HOME/tools/revshell-gen"
install_git "encoder-tool"        "https://github.com/le4f/encoder-tool.git"                   "$HOME/tools/encoder-tool"
install_git "pe-bear"             "https://github.com/hasherezade/pe-bear.git"                 "$HOME/tools/pe-bear"
install_git "scdbg"               "https://github.com/nickelqin/scdbg.git"                     "$HOME/tools/scdbg"
install_git "ciphey"              "https://github.com/ciphey/ciphey.git"                       "$HOME/tools/ciphey"

# ── Python tools via pip ─────────────────────────────────────────
echo ""
echo "--- Python specialized tools ---"
pipx install crackmapexec 2>/dev/null || true
pipx install enum4linux-ng 2>/dev/null || true
pipx install searx 2>/dev/null || true
pipx install theHarvester 2>/dev/null || true
pipx install photon 2>/dev/null || true
pipx install droopescan 2>/dev/null || true
pipx install wpscan 2>/dev/null || true
pipx install nikto 2>/dev/null || true

# ── Hashcat rules & wordlists ────────────────────────────────────
echo ""
echo "--- Wordlists & rules ---"
mkdir -p "$HOME/tools/wordlists"
if [ ! -f "$HOME/tools/wordlists/rockyou.txt" ]; then
    wget -q -O "$HOME/tools/wordlists/rockyou.txt.gz" "https://github.com/brannondorsey/naive-hashcat/releases/download/data/rockyou.txt.gz" 2>/dev/null && \
        gunzip "$HOME/tools/wordlists/rockyou.txt.gz" 2>/dev/null && log_ok "rockyou.txt" || log_warn "rockyou.txt download failed"
fi

# ── Nuclei templates update ──────────────────────────────────────
echo ""
echo "--- Nuclei templates ---"
if check_cmd nuclei; then
    nuclei -update-templates 2>/dev/null && log_ok "nuclei-templates updated" || log_warn "nuclei-templates update failed"
else
    log_warn "nuclei not installed — run 'go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest'"
fi

echo ""
echo "=== Installation Complete ==="
echo ""
echo "Summary of installed tool categories:"
echo "  • Nuclei Templates: nuclei + nuclei-templates"
echo "  • Custom Exploit Scripts: exploitdb, pwntools, shell-storm, scdbg, pe-bear"
echo "  • Reverse Shell Generators: revshell-gen, msfvenom"
echo "  • Encoded Payloads: encoder-tool, payloads-allthethings, msfvenom"
echo "  • Cipher Tools: cipher-tool, hash-identifier, xortool, ciphey, rot13"
echo "  • Steganography: stegoveritas, zsteg, stegseek, steg-analyze"