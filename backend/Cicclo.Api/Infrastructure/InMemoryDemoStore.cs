using System.Collections.Concurrent;
using Cicclo.Api.Domain;

namespace Cicclo.Api.Infrastructure;

public sealed class InMemoryDemoStore
{
    private readonly ConcurrentDictionary<Guid, DemoSession> _sessions = new();

    public DemoSession CreateSession()
    {
        while (true)
        {
            var session = new DemoSession();

            if (_sessions.TryAdd(session.Id, session))
            {
                return session;
            }
        }
    }

    public bool TryGetBalance(Guid sessionId, out Money balance)
    {
        if (_sessions.TryGetValue(sessionId, out var session))
        {
            balance = session.Balance;
            return true;
        }

        balance = default;
        return false;
    }
}