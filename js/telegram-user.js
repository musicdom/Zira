
(()=>{const avatarEl=document.querySelector('#avatar');const open=()=>{if(typeof window.openZiraAdmin==='function'){window.openZiraAdmin();return}location.hash='admin'};avatarEl?.addEventListener('click',open);})();
