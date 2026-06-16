import * as tf from "@tensorflow/tfjs";

export function createRouteEncoderModel(vocabSize: number, maxSequenceLength: number, embeddingDim = 128): tf.LayersModel {

    const inputIds = tf.input({shape: [maxSequenceLength], dtype: "int32", name: "inputIds"});
    const attentionMask = tf.input({shape: [maxSequenceLength], dtype: "float32", name: "attentionMask"});

    const tokenEmbeddings = tf.layers.embedding({
        inputDim: vocabSize,
        outputDim: embeddingDim,
        embeddingsInitializer: "glorotUniform",
        name: "tokenEmbedding",
    }).apply(inputIds) as tf.SymbolicTensor;

    // (batch, seqLen, 128)
    const maskExpanded = tf.layers.reshape({
        targetShape: [maxSequenceLength, 1],
    }).apply(attentionMask) as tf.SymbolicTensor;

    // применяем mask к эмбеддингам
    const maskedEmbeddings = tf.layers.multiply()
        .apply([
            tokenEmbeddings,
            maskExpanded,
        ]) as tf.SymbolicTensor;

    // усредняем только реальные токены
    const pooled = tf.layers.globalAveragePooling1d()
        .apply(maskedEmbeddings) as tf.SymbolicTensor;

    const dense1 = tf.layers.dense({
        units: 256,
        activation: "relu",
        name: "projection1",
    }).apply(pooled) as tf.SymbolicTensor;

    const dropout = tf.layers.dropout({
        rate: 0.1,
    }).apply(dense1) as tf.SymbolicTensor;

    const embedding = tf.layers.dense({
        units: 128,
        activation: undefined,
        name: "embedding",
    }).apply(dropout) as tf.SymbolicTensor;

    return tf.model({
        inputs: [
            inputIds,
            attentionMask,
        ],
        outputs: embedding,
        name: "routeEncoder",
    });
}