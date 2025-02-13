interface UploadButtonProps {
  onPdfUploaded: (url: string) => void;
}

const UploadButton: React.FC<UploadButtonProps> = ({ onPdfUploaded }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file && file.type === "application/pdf") {
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        const url = e.target?.result as string;
        onPdfUploaded(url);
      };
      fileReader.readAsDataURL(file);
    } else {
      alert("Please select a valid PDF file.");
    }
  };

  return (
    <input type="file" accept="application/pdf" onChange={handleFileChange} />
  );
};

export default UploadButton;
