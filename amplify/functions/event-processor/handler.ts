import { SQSEvent, SQSRecord, Context } from 'aws-lambda';
import { SQSClient, DeleteMessageCommand } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({});

export const handler = async (event: SQSEvent, context: Context): Promise<void> => {
    for (const record of event.Records) {
        try {
            await processRecord(record);
        } catch (error) {
            console.error('Error processing record:', error);
        }
    }
};

async function processRecord(record: SQSRecord): Promise<void> {
    console.log('Processing message:', record.body);

    // Delete the message from the queue
    const deleteParams = {
        QueueUrl: process.env.QUEUE_URL,
        ReceiptHandle: record.receiptHandle,
    };

    try {
        await sqs.send(new DeleteMessageCommand(deleteParams));
        console.log('Message deleted from queue by eventProcessor.');
    } catch (error) {
        console.error('Error deleting message from queue:', error);
        throw error;
    }
}