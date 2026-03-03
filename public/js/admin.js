<script>
document.querySelectorAll('.collapsible-card-header').forEach(header => {
  header.addEventListener('click', () => {
    const body = header.nextElementSibling;
    if(body.style.display === 'flex'){
      body.style.display = 'none';
    } else {
      body.style.display = 'flex';
    }
    header.querySelector('.chevron').classList.toggle('open');
  });
});

document.querySelectorAll('.collapsible-card-header').forEach(header => {
  header.addEventListener('click', () => {
    const body = header.nextElementSibling;
    body.classList.toggle('show');

    const chevron = header.querySelector('.chevron');
    chevron.classList.toggle('open');
  });
});
</script>