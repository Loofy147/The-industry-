const { parseCsv } = require('./csv_parser');
const { constantTimeEquals } = require('./secure_compare');
const { FlawedSingleton, SecureSingleton } = require('./singleton');
const { throttle, memoizeAsync } = require('./async_utils');
const { validateAndClean } = require('./data_validator');
const { makeIdempotent, clearIdempotencyStore } = require('./idempotency_middleware');
const { MonolithicUserService, monolithicUserService } = require('./monolithic_user_service');
const { EmailService, emailService } = require('../systems/notification_service/email_service');
const { UserRepository, userRepository } = require('./user_repository');
const { UserLogic } = require('../systems/user_service/user_logic');
const { TightlyCoupledReportGenerator } = require('./tightly_coupled_report_generator');
const { DecoupledReportGenerator, MySqlDatabase, FileSystemLogger, CloudLogger } = require('./decoupled_report_generator');
const { StatefulWebServer } = require('./stateful_web_server');
const { StateManager, stateManager, clearExternalStore } = require('./state_manager');
const { StatelessWebServer } = require('./stateless_web_server');
const { InadequateLoggingService } = require('./inadequate_logging_service');
const { StructuredLogger, baseLogger } = require('./structured_logger');
const { ObservableService } = require('./observable_service');
const { HardcodedConfigService } = require('./hardcoded_config_service');
const { config, loadConfig } = require('./config_loader');
const { ConfigurableService } = require('./configurable_service');
const { SagaOrchestrator, sagaOrchestrator } = require('./saga_orchestrator');
const { USER_REGISTRATION_SAGA } = require('./user_registration_saga');
const { EventStore } = require('./event_store'); // No longer exporting a singleton instance
const { User } = require('./user_aggregate');
const { UserReadModelProjector } = require('./user_read_model_projector');
const { NotificationHandler } = require('../systems/notification_service/notification_handler');
const { MessageBus, messageBus } = require('./message_bus');
const { WebSocketGateway } = require('./websocket_gateway');
const { CorrelationContext, getContext, setContext, Tracer } = require('./observability');
const { RulesEngine } = require('./rules_engine');
const { SchemaRegistry, schemaRegistry } = require('./schema_registry');
const { SchemaValidator, schemaValidator } = require('./schema_validator');

module.exports = {
  parseCsv,
  constantTimeEquals,
  FlawedSingleton,
  SecureSingleton,
  throttle,
  memoizeAsync,
  validateAndClean,
  makeIdempotent,
  clearIdempotencyStore,
  MonolithicUserService,
  monolithicUserService,
  EmailService,
  emailService,
  UserRepository,
  userRepository,
  UserLogic,
  TightlyCoupledReportGenerator,
  DecoupledReportGenerator,
  MySqlDatabase,
  FileSystemLogger,
  CloudLogger,
  StatefulWebServer,
  StateManager,
  stateManager,
  clearExternalStore,
  StatelessWebServer,
  InadequateLoggingService,
  StructuredLogger,
  baseLogger,
  ObservableService,
  HardcodedConfigService,
  config,
  loadConfig,
  ConfigurableService,
  SagaOrchestrator,
  sagaOrchestrator,
  USER_REGISTRATION_SAGA,
  EventStore, // Exporting the class only
  User,
  UserReadModelProjector,
  NotificationHandler,
  MessageBus,
  messageBus,
  WebSocketGateway,
  CorrelationContext,
  getContext,
  setContext,
  Tracer,
  RulesEngine,
  SchemaRegistry,
  schemaRegistry,
  SchemaValidator,
  schemaValidator,
};
