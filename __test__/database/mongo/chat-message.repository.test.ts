import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { Connection, Model } from "mongoose";
import { ChatMessage, ChatMessageRepository, ChatMessageSchema, NotExistDataError } from "../../../database";

let mongod: MongoMemoryServer;
let connector: Connection;
let ChatMessageModel: Model<ChatMessage>;
let repository: ChatMessageRepository;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  connector = mongoose.createConnection(mongod.getUri());
  ChatMessageModel = connector.model<ChatMessage>("chatMessage", ChatMessageSchema);
  repository = new ChatMessageRepository(ChatMessageModel);
});

const CREATED_DATE = new Date(2000, 1, 1);
const messages = [
  {
    walletAddress: "지갑 주소 1",
    message: "메세지1",
    date: CREATED_DATE,
  },
  {
    walletAddress: "지갑 주소 2",
    message: "메세지2",
    date: CREATED_DATE,
  },
  {
    walletAddress: "지갑 주소 1",
    message: "메세지3",
    date: CREATED_DATE,
  },
];

afterAll(async () => {
  await connector.destroy();
  await mongod.stop();
});

describe("ChatMessageRepository", () => {
  describe("find* 테스트", () => {
    beforeEach(async () => {
      const chatMessage = new ChatMessageModel({
        roomId: 1,
        messages,
      });
      await chatMessage.save();
    });

    afterEach(async () => {
      await ChatMessageModel.deleteMany();
    });

    const ORDER_ID = 1;
    const NOT_EXIST_ORDER_ID = 66;
    const CREATED_DATE = new Date(2000, 1, 1);

    describe("findAllMessageByOrderId 테스트", () => {
      test("통과하는 테스트", async () => {
        await expect(repository.findAllMessageByOrderId(ORDER_ID)).resolves.toEqual({
          messages: [
            { walletAddress: "지갑 주소 1", message: "메세지1", date: CREATED_DATE },
            { walletAddress: "지갑 주소 2", message: "메세지2", date: CREATED_DATE },
            { walletAddress: "지갑 주소 1", message: "메세지3", date: CREATED_DATE },
          ],
        });
      });

      test("실패하는 테스트, 존재하지 않는 값 입력", async () => {
        await expect(repository.findAllMessageByOrderId(NOT_EXIST_ORDER_ID)).rejects.toStrictEqual(
          new NotExistDataError("데이터가 존재하지 않습니다."),
        );
      });
    });

    describe("findRecentMessageByOrderId 테스트", () => {
      test("통과하는 테스트", async () => {
        await expect(repository.findRecentMessageByOrderId(ORDER_ID)).resolves.toStrictEqual({
          walletAddress: "지갑 주소 1",
          message: "메세지3",
          date: CREATED_DATE,
        });
      });

      test("실패하는 테스트, 존재하지 않는 값 입력", async () => {
        await expect(repository.findRecentMessageByOrderId(NOT_EXIST_ORDER_ID)).rejects.toStrictEqual(
          new NotExistDataError(`${NOT_EXIST_ORDER_ID}에 대한 데이터가 존재하지 않습니다.`),
        );
      });
    });
  });

  describe("saveMessage 테스트", () => {
    const ORDER_ID = 1;
    const walletAddress = "지갑 주소 4";

    afterEach(async () => {
      await ChatMessageModel.deleteMany();
    });

    test("통과하는 테스트, 채팅방이 생성되지 않았으면 생성후 메시지를 저장", async () => {
      const date = new Date(2000, 1, 1);

      const message = "메시지1";

      await repository.saveMessage(ORDER_ID, {
        walletAddress,
        message,
        date,
      });

      const result = await ChatMessageModel.findOne({ roomId: ORDER_ID })
        .select(["-__v", "-_id", "-messages._id"])
        .lean();

      expect(result).toEqual({
        roomId: ORDER_ID,
        messages: [
          {
            date,
            message,
            walletAddress,
          },
        ],
      });
    });

    test("통과하는 테스트, 여러개의 메시지 저장", async () => {
      const date = new Date(1999, 1, 1);

      const saveMessage = async (message: string) => {
        await repository.saveMessage(ORDER_ID, {
          walletAddress,
          message,
          date,
        });
      };

      await saveMessage("메시지1");
      await saveMessage("메시지2");

      const result = await ChatMessageModel.findOne({ roomId: ORDER_ID })
        .select(["-__v", "-_id", "-messages._id"])
        .lean();

      expect(result).toEqual({
        roomId: ORDER_ID,
        messages: [
          { walletAddress, date, message: "메시지1" },
          { walletAddress, date, message: "메시지2" },
        ],
      });
    });
  });
});
