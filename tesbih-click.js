// Générateur de son tesbih optimisé
function generateTesbihMP3() {
    // Créer un son tesbih réaliste et l'exporter
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const sampleRate = 22050; // Réduit pour taille fichier
    const duration = 0.12; // Court et précis

    const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        let sample = 0;

        // Clic net de perle
        if (t < 0.015) {
            const freq = 850 - (t / 0.015) * 450;
            sample += Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 80) * 0.9;
        }

        // Résonance bois
        if (t < 0.06) {
            const freq = 280 - (t / 0.06) * 130;
            sample += Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 20) * 0.3;
        }

        data[i] = sample;
    }

    return buffer;
}