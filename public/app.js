const form = document.getElementById("uploadForm");
const status = document.getElementById("status");
const resultBox = document.getElementById("resultBox");
const resultVideo = document.getElementById("resultVideo");
const downloadLink = document.getElementById("downloadLink");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);

  status.textContent = "جاري تجهيز الملفات والدمج...";

  try {
    const response = await fetch("/api/merge", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      status.textContent = data.message || "حدث خطأ أثناء المعالجة.";
      return;
    }

    status.textContent = "تمت معالجة الفيديو بنجاح. يمكنك معاينة النتيجة.";
    resultBox.classList.remove("hidden");
    resultVideo.src = data.url;
    downloadLink.href = data.url;
    downloadLink.textContent = "تحميل الفيديو النهائي";
    resultVideo.play();
  } catch (error) {
    console.error(error);
    status.textContent = "فشل الاتصال بالخادم. تأكد من تشغيل المشروع.";
  }
});
